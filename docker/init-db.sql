-- PhishBlocker Database Initialization

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS phishblocker;

-- Use the database
\c phishblocker;

-- Users table for analytics
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(255) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_scans INTEGER DEFAULT 0,
    phishing_encounters INTEGER DEFAULT 0,
    risk_score FLOAT DEFAULT 0.0
);

-- URL scans table for tracking all scans
CREATE TABLE IF NOT EXISTS url_scans (
    scan_id VARCHAR(255) PRIMARY KEY,
    url TEXT NOT NULL,
    user_id VARCHAR(255),
    is_phishing BOOLEAN NOT NULL,
    confidence FLOAT NOT NULL,
    threat_level VARCHAR(50) NOT NULL,
    risk_factors JSONB,
    scan_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    model_version VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Feedback table for user reports
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    scan_id VARCHAR(255),
    user_reported_phishing BOOLEAN NOT NULL,
    user_feedback TEXT,
    feedback_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE
);

-- Threat intelligence table for known bad domains
CREATE TABLE IF NOT EXISTS threat_intelligence (
    domain VARCHAR(255) PRIMARY KEY,
    threat_type VARCHAR(100) NOT NULL,
    confidence_score FLOAT NOT NULL,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Model metrics table for tracking performance
CREATE TABLE IF NOT EXISTS model_metrics (
    metric_id SERIAL PRIMARY KEY,
    model_version VARCHAR(50) NOT NULL,
    accuracy FLOAT,
    precision_score FLOAT,
    recall FLOAT,
    f1_score FLOAT,
    auc_roc FLOAT,
    total_predictions INTEGER,
    true_positives INTEGER,
    false_positives INTEGER,
    true_negatives INTEGER,
    false_negatives INTEGER,
    evaluation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_url_scans_timestamp ON url_scans(scan_timestamp);
CREATE INDEX IF NOT EXISTS idx_url_scans_user_id ON url_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_url_scans_threat_level ON url_scans(threat_level);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_active ON threat_intelligence(is_active);

-- Sample data for demonstration
INSERT INTO users (user_id, total_scans, phishing_encounters, risk_score) 
VALUES 
    ('demo_user', 150, 5, 3.3),
    ('extension_user', 89, 2, 2.2),
    ('dashboard_user', 45, 1, 2.0)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO threat_intelligence (domain, threat_type, confidence_score, source)
VALUES 
    ('phishing-example.com', 'Phishing', 0.95, 'PhishTank'),
    ('malware-site.net', 'Malware', 0.88, 'Manual Report'),
    ('fake-bank.tk', 'Financial Fraud', 0.92, 'User Report')
ON CONFLICT (domain) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO phishblocker;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO phishblocker;
