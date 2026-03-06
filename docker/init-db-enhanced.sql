-- PhishBlocker Enhanced Database Schema
-- Optimized for performance with indexes and materialized views

-- ===================================
-- Main Tables
-- ===================================

-- URL Scans Table
CREATE TABLE IF NOT EXISTS scans (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    url_hash VARCHAR(64) NOT NULL,
    user_id VARCHAR(255),
    is_phishing BOOLEAN NOT NULL,
    confidence FLOAT NOT NULL,
    threat_level VARCHAR(20) NOT NULL,
    risk_factors JSONB,
    llm_analysis JSONB,
    scan_duration_ms INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scan_id VARCHAR(64) UNIQUE NOT NULL
);

-- Performance Indexes for scans table
CREATE INDEX IF NOT EXISTS idx_scans_user_timestamp ON scans(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_scans_url_hash ON scans(url_hash);
CREATE INDEX IF NOT EXISTS idx_scans_timestamp ON scans(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_scans_scan_id ON scans(scan_id);

-- Partial index for phishing URLs only (smaller, faster)
CREATE INDEX IF NOT EXISTS idx_phishing_urls ON scans(url, timestamp DESC) WHERE is_phishing = true;

-- Index for threat level queries
CREATE INDEX IF NOT EXISTS idx_scans_threat_level ON scans(threat_level, timestamp DESC);

-- GIN index for JSONB fields (for querying risk factors)
CREATE INDEX IF NOT EXISTS idx_scans_risk_factors ON scans USING GIN(risk_factors);
CREATE INDEX IF NOT EXISTS idx_scans_llm_analysis ON scans USING GIN(llm_analysis);

-- ===================================
-- LLM Analysis Cache Table
-- ===================================

CREATE TABLE IF NOT EXISTS llm_analysis_cache (
    id SERIAL PRIMARY KEY,
    url_hash VARCHAR(64) UNIQUE NOT NULL,
    url TEXT NOT NULL,
    analysis JSONB NOT NULL,
    model_used VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accessed_count INTEGER DEFAULT 1,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Indexes for LLM cache
CREATE INDEX IF NOT EXISTS idx_llm_cache_url_hash ON llm_analysis_cache(url_hash);
CREATE INDEX IF NOT EXISTS idx_llm_cache_created ON llm_analysis_cache(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_cache_expires ON llm_analysis_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_llm_cache_accessed ON llm_analysis_cache(accessed_count DESC);

-- ===================================
-- User Feedback Table
-- ===================================

CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    scan_id VARCHAR(64) REFERENCES scans(scan_id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_phishing BOOLEAN NOT NULL,
    user_feedback TEXT,
    feedback_type VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for feedback
CREATE INDEX IF NOT EXISTS idx_feedback_scan_id ON feedback(scan_id);
CREATE INDEX IF NOT EXISTS idx_feedback_timestamp ON feedback(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);

-- ===================================
-- User Analytics Table
-- ===================================

CREATE TABLE IF NOT EXISTS user_analytics (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    total_scans INTEGER DEFAULT 0,
    phishing_encounters INTEGER DEFAULT 0,
    risk_score FLOAT DEFAULT 0.0,
    last_scan TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user analytics
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_risk_score ON user_analytics(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_last_scan ON user_analytics(last_scan DESC);

-- ===================================
-- Threat Intelligence Table
-- ===================================

CREATE TABLE IF NOT EXISTS threat_intelligence (
    id SERIAL PRIMARY KEY,
    url_hash VARCHAR(64) UNIQUE NOT NULL,
    url TEXT NOT NULL,
    source VARCHAR(100) NOT NULL,
    threat_type VARCHAR(50),
    confidence FLOAT,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Indexes for threat intelligence
CREATE INDEX IF NOT EXISTS idx_threat_url_hash ON threat_intelligence(url_hash);
CREATE INDEX IF NOT EXISTS idx_threat_source ON threat_intelligence(source);
CREATE INDEX IF NOT EXISTS idx_threat_active ON threat_intelligence(is_active, last_updated DESC);

-- ===================================
-- Materialized Views for Analytics
-- ===================================

-- Global statistics view (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS global_stats AS
SELECT 
    DATE_TRUNC('day', timestamp) as scan_date,
    COUNT(*) as total_scans,
    SUM(CASE WHEN is_phishing THEN 1 ELSE 0 END) as phishing_count,
    SUM(CASE WHEN NOT is_phishing THEN 1 ELSE 0 END) as safe_count,
    AVG(confidence) as avg_confidence,
    AVG(scan_duration_ms) as avg_duration_ms,
    COUNT(DISTINCT user_id) as unique_users
FROM scans
GROUP BY scan_date
ORDER BY scan_date DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_global_stats_date ON global_stats(scan_date DESC);

-- Hourly statistics for real-time monitoring
CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_stats AS
SELECT 
    DATE_TRUNC('hour', timestamp) as scan_hour,
    COUNT(*) as total_scans,
    SUM(CASE WHEN is_phishing THEN 1 ELSE 0 END) as phishing_count,
    AVG(confidence) as avg_confidence,
    AVG(scan_duration_ms) as avg_duration_ms
FROM scans
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY scan_hour
ORDER BY scan_hour DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_hourly_stats_hour ON hourly_stats(scan_hour DESC);

-- Top phishing domains view
CREATE MATERIALIZED VIEW IF NOT EXISTS top_phishing_domains AS
SELECT 
    SUBSTRING(url FROM 'https?://([^/]+)') as domain,
    COUNT(*) as detection_count,
    AVG(confidence) as avg_confidence,
    MAX(timestamp) as last_seen
FROM scans
WHERE is_phishing = true
GROUP BY domain
ORDER BY detection_count DESC
LIMIT 100;

CREATE INDEX IF NOT EXISTS idx_top_phishing_domain ON top_phishing_domains(domain);

-- ===================================
-- Functions and Triggers
-- ===================================

-- Function to update user analytics
CREATE OR REPLACE FUNCTION update_user_analytics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_analytics (user_id, total_scans, phishing_encounters, last_scan)
    VALUES (
        NEW.user_id,
        1,
        CASE WHEN NEW.is_phishing THEN 1 ELSE 0 END,
        NEW.timestamp
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_scans = user_analytics.total_scans + 1,
        phishing_encounters = user_analytics.phishing_encounters + CASE WHEN NEW.is_phishing THEN 1 ELSE 0 END,
        risk_score = (user_analytics.phishing_encounters + CASE WHEN NEW.is_phishing THEN 1 ELSE 0 END)::FLOAT / 
                     (user_analytics.total_scans + 1) * 100,
        last_scan = NEW.timestamp,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update user analytics
DROP TRIGGER IF EXISTS trigger_update_user_analytics ON scans;
CREATE TRIGGER trigger_update_user_analytics
    AFTER INSERT ON scans
    FOR EACH ROW
    WHEN (NEW.user_id IS NOT NULL)
    EXECUTE FUNCTION update_user_analytics();

-- Function to clean old LLM cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_llm_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM llm_analysis_cache
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- Partitioning for scans table (optional, for high volume)
-- ===================================

-- Uncomment for time-based partitioning (recommended for >1M scans/month)
/*
CREATE TABLE scans_2025_01 PARTITION OF scans
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE scans_2025_02 PARTITION OF scans
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
*/

-- ===================================
-- Initial Data / Seed
-- ===================================

-- Insert sample configuration
CREATE TABLE IF NOT EXISTS system_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO system_config (key, value) VALUES
    ('db_version', '2.0'),
    ('last_migration', NOW()::TEXT),
    ('cache_ttl_seconds', '3600'),
    ('llm_cache_ttl_days', '7')
ON CONFLICT (key) DO NOTHING;

-- ===================================
-- Maintenance Queries
-- ===================================

-- Refresh materialized views (run periodically via cron)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY global_stats;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY hourly_stats;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY top_phishing_domains;

-- Clean old scans (optional, run monthly)
-- DELETE FROM scans WHERE timestamp < NOW() - INTERVAL '90 days';

-- Vacuum and analyze for performance
-- VACUUM ANALYZE scans;
-- VACUUM ANALYZE llm_analysis_cache;
