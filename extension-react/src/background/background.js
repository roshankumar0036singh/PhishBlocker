// import { initLocalInference, predictLocal } from './local_inference'; // Phase 49: Deactivated
import { initAdBlocker } from './ad_blocking_engine';

// Initialize engines
// initLocalInference(); // Phase 49: Deactivated
initAdBlocker();

const API_BASE_URL = 'http://localhost:8000'
const PB_INTERNAL_KEY = 'pb_dev_master_auth_token_secure_32'; // Phase 47: Master Key

// Unified Request Helper (Phase 47)
async function pbFetch(endpoint, options = {}) {
    console.log(`PhishBlocker: Fetching ${endpoint} with Auth Protocol...`);
    const headers = {
        ...options.headers,
        'X-API-Key': PB_INTERNAL_KEY,
        'Content-Type': 'application/json'
    };
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

    // Phase 51: Harden error handling. Throw if NOT ok so it hits the .catch() blocks properly.
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`PhishBlocker API Error (${response.status}):`, errorText);
        throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    return response;
}

// Listen for URL navigation
chrome.webNavigation.onCommitted.addListener(async (details) => {
    if (details.frameId !== 0) return // Only main frame

    // Phase 47: Non-blocking scan. Don't await the entire analysis block.
    // Let the page load, and analysis happens in parallel.
    processScan(details).catch(err => console.error("Async Scan Error:", err));
});

async function processScan(details) {
    const url = details.url;

    // Phase 47: Check local cache first to reduce API load
    const { scanCache = {} } = await chrome.storage.local.get(['scanCache']);
    const cached = scanCache[url];
    if (cached && (Date.now() - cached.timestamp < 3600000)) { // 1 hour cache
        console.log('PhishBlocker: Cache hit for:', url);
        chrome.storage.local.set({ lastScanResult: cached.result });
        if (cached.result.is_phishing) {
            handleScanResponse(url, cached.result, details.tabId);
        }
        return;
    }

    const { settings = { enabled: true, blockPhishing: true, showWarnings: true } } = await chrome.storage.sync.get(['settings']);
    if (!settings.enabled) return;

    let domain = '';
    try {
        domain = new URL(url).hostname;
    } catch (e) {
        domain = url;
    }

    // Skip internal, extension, and restricted URLs
    if (url.startsWith('chrome://') ||
        url.startsWith('chrome-extension://') ||
        url.startsWith('devtools://') ||
        url.startsWith('about:')) {
        return;
    }

    // Check temporary bypass (Session-based)
    const { tempBypass } = await chrome.storage.local.get(['tempBypass']);
    if (tempBypass && tempBypass === url) {
        console.log('PhishBlocker: Bypassing blocked resource:', url);
        return;
    }

    // Check permanent whitelist (Trusted Enclave)
    const { whitelist = [] } = await chrome.storage.sync.get(['whitelist']);
    if (whitelist.includes(domain.toLowerCase())) {
        console.log('PhishBlocker: Trusted Enclave hit for:', domain);
        return;
    }

    // Request DOM analysis from content script
    let domData = null;
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id === details.tabId) {
            domData = await new Promise((resolve) => {
                chrome.tabs.sendMessage(details.tabId, { action: 'scanDOM' }, (response) => {
                    if (chrome.runtime.lastError) {
                        resolve(null);
                    } else {
                        resolve(response);
                    }
                });
            });
        }
    } catch (e) {
        console.log("DOM scan error:", e);
    }

    // Scan URL with DOM context
    try {
        const result = await scanUrl(url, domData);

        // Store scan result & history
        chrome.storage.local.set({ lastScanResult: result });
        const { recentScans = [] } = await chrome.storage.local.get(['recentScans']);
        recentScans.unshift({
            url,
            is_phishing: result.is_phishing,
            threat_level: result.threat_level,
            confidence: result.confidence,
            timestamp: new Date().toISOString()
        });
        chrome.storage.local.set({ recentScans: recentScans.slice(0, 10) });

        // Phase 47: Update local cache
        const { scanCache: updatedCache = {} } = await chrome.storage.local.get(['scanCache']);
        updatedCache[url] = { result, timestamp: Date.now() };
        // Cleanup old cache entries (keep last 50)
        const keys = Object.keys(updatedCache);
        if (keys.length > 50) delete updatedCache[keys[0]];
        chrome.storage.local.set({ scanCache: updatedCache });

        // Update stats
        updateStats(result);

        // Handle the response
        handleScanResponse(url, result, details.tabId, settings);
    } catch (error) {
        console.error('Scan error:', error);
    }
}

// Separate response handler for cleaner flow
function handleScanResponse(url, result, tabId, settings = { blockPhishing: true, showWarnings: true }) {
    if (result.is_phishing && settings.blockPhishing && result.confidence > 0.7) {
        const warningUrl = chrome.runtime.getURL('src/warning/warning.html') + '?url=' + encodeURIComponent(url);
        console.log('PhishBlocker: Threat detected, redirecting:', warningUrl);
        chrome.tabs.update(tabId, { url: warningUrl }).catch(err => console.error("Redirect failed:", err));
    } else if (result.is_phishing && settings.showWarnings) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'PhishBlocker Alpha Alert',
            message: `Potential risk detected: ${new URL(url).hostname}`,
            priority: 2
        });
    }
}

// Scan URL function
async function scanUrl(url, domData = null, gemini_api_key = null) {
    try {
        const bodyPayload = {
            url: url,
            user_id: 'extension_user',
        };

        if (domData) {
            bodyPayload.dom_data = domData;
        }

        if (gemini_api_key) {
            bodyPayload.gemini_api_key = gemini_api_key;
        }

        // Phase 49: Local ML Deactivated due to false positives. 
        // Proceeding directly to backend ensemble.

        const response = await pbFetch('/scan', {
            method: 'POST',
            body: JSON.stringify(bodyPayload),
        })

        if (!response.ok) {
            const errorText = await response.text();
            console.error('PhishBlocker Scan failed:', errorText);
            throw new Error(`Scan failed: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
        } else {
            const text = await response.text();
            console.error('PhishBlocker Non-JSON response:', text);
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('PhishBlocker API error:', error)
        // If it's a fetch error, it might be the background service worker losing context or API being down
        return {
            url,
            is_phishing: false,
            confidence: 0,
            threat_level: 'Offline',
            risk_factors: ['API Connection Failure: Result unverified'],
            error: error.message
        }
    }
}

// Enable side panel on click
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

// Update statistics
async function updateStats(result) {
    const stats = await chrome.storage.local.get(['stats'])
    const currentStats = stats.stats || {
        scansToday: 0,
        threatsBlocked: 0,
        lastScan: null,
    }

    // Check if it's a new day
    const today = new Date().toDateString()
    const lastScanDate = currentStats.lastScan ? new Date(currentStats.lastScan).toDateString() : null

    if (lastScanDate !== today) {
        currentStats.scansToday = 0
    }

    currentStats.scansToday++
    if (result.is_phishing) {
        currentStats.threatsBlocked++
    }
    currentStats.lastScan = new Date().toISOString()

    await chrome.storage.local.set({ stats: currentStats })
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scanUrl') {
        const urlToScan = request.url;
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            let domData = null;
            if (tabs[0] && tabs[0].url === urlToScan) {
                try {
                    domData = await new Promise((resolve) => {
                        chrome.tabs.sendMessage(tabs[0].id, { action: 'scanDOM' }, (response) => {
                            if (chrome.runtime.lastError) {
                                resolve(null);
                            } else {
                                resolve(response);
                            }
                        });
                    });
                } catch (e) {
                    console.error("Manual scan DOM analysis failed:", e);
                }
            }
            const result = await scanUrl(urlToScan, domData, request.gemini_api_key);
            sendResponse(result);
        });
        return true // Keep channel open for async response
    }

    if (request.action === 'refreshProtection') {
        console.log('Protection rules refreshed')
        sendResponse({ success: true })
    }

    if (request.action === 'reportFalsePositive') {
        console.log('PhishBlocker: Reporting false positive for:', request.url)

        fetch(`${API_BASE_URL}/api/feedback/false-positive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: request.url,
                metadata: request.metadata,
                timestamp: new Date().toISOString()
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log('PhishBlocker: FP report successful:', data)
                sendResponse({ success: true })
            })
            .catch(err => {
                console.error('PhishBlocker: FP report failed:', err)
                sendResponse({ success: false, error: err.message })
            })
        return true
    }

    if (request.action === 'shareThreat') {
        console.log('PhishBlocker: Sharing threat with community:', request.url)

        pbFetch('/api/threats/share', {
            method: 'POST',
            body: JSON.stringify({
                url: request.url,
                threat_type: request.metadata?.threat_level || 'phishing',
                severity: request.metadata?.confidence > 0.9 ? 'critical' : 'high',
                scanner_id: 'extension_node_1'
            })
        })
            .then(response => response.json())
            .then(async (data) => {
                console.log('PhishBlocker: Threat shared successfully:', data)

                // Add to local recent scans immediately for instant feed updates
                const res = await chrome.storage.local.get(['recentScans'])
                const recent = res.recentScans || []
                const newScan = {
                    id: Date.now(),
                    url: request.url,
                    is_phishing: true,
                    confidence: request.metadata?.confidence || 0.98,
                    threat_level: request.metadata?.threat_level || 'High',
                    timestamp: new Date().toISOString()
                }
                await chrome.storage.local.set({
                    recentScans: [newScan, ...recent].slice(0, 50)
                })

                // Phase 48: Broadcast sync to all UI components
                chrome.runtime.sendMessage({ action: 'COMMUNITY_THREAT_SHARED', url: request.url }).catch(() => { });

                sendResponse({ success: true })
            })
            .catch(err => {
                console.error('PhishBlocker: Threat sharing failed:', err)
                sendResponse({ success: false, error: err.message })
            })
        return true
    }

    if (request.action === 'adRemovedCosmetically') {
        chrome.storage.local.get(['adBlockStats'], (res) => {
            const stats = res.adBlockStats || { blockedCount: 0 };
            stats.blockedCount++;
            chrome.storage.local.set({ adBlockStats: stats });
        });
    }
})

// Listen for storage changes to toggle tracker rules
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.settings) {
        const newSettings = changes.settings.newValue
        if (newSettings) {
            updateTrackerRules(newSettings.blockTrackers)
        }
    }
})

// Update declarativeNetRequest rulesets
function updateTrackerRules(enabled) {
    chrome.declarativeNetRequest.updateEnabledRulesets({
        [enabled ? "enableRulesetIds" : "disableRulesetIds"]: ["tracker_rules"]
    }).then(() => {
        console.log(`Tracker rules ${enabled ? 'enabled' : 'disabled'}`)
    }).catch(err => {
        console.error('Error updating tracker rules:', err)
    })
}

// Initial ruleset setup
chrome.storage.sync.get(['settings'], (result) => {
    const settings = result.settings || { blockTrackers: true }
    updateTrackerRules(settings.blockTrackers !== false)
})

console.log('PhishBlocker background service worker loaded')
