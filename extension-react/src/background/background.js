// Background service worker for PhishBlocker extension
import { initLocalInference, predictLocal } from './local_inference';

// Initialize local ML engine session immediately
initLocalInference();

const API_BASE_URL = 'http://localhost:8000'

// Listen for URL navigation
chrome.webNavigation.onCommitted.addListener(async (details) => {
    if (details.frameId !== 0) return // Only main frame

    const result = await chrome.storage.sync.get(['settings'])
    const settings = result.settings || { enabled: true, blockPhishing: true, showWarnings: true }

    if (!settings.enabled) return

    const url = details.url
    let domain = ''
    try {
        domain = new URL(url).hostname
    } catch (e) {
        domain = url
    }

    // Skip chrome:// and extension URLs
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
        return
    }

    // Check temporary bypass (Session-based)
    const { tempBypass } = await chrome.storage.local.get(['tempBypass'])
    if (tempBypass) {
        try {
            const bypassUrl = new URL(tempBypass)
            const currentUrl = new URL(url)
            // Match without trailing slashes or protocols if needed, but hostname + path is usually safest
            if (bypassUrl.origin === currentUrl.origin && bypassUrl.pathname.replace(/\/$/, '') === currentUrl.pathname.replace(/\/$/, '')) {
                console.log('PhishBlocker: Bypassing blocked resource:', url)
                return
            }
        } catch (e) {
            if (tempBypass === url) return
        }
    }

    // Check permanent whitelist (Trusted Enclave)
    const whitelistResult = await chrome.storage.sync.get(['whitelist'])
    const whitelist = whitelistResult.whitelist || []
    if (whitelist.includes(domain.toLowerCase())) {
        console.log('PhishBlocker: Trusted Enclave hit for:', domain)
        return
    }

    // Request DOM analysis from content script
    let domData = null;
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id === details.tabId) {
            domData = await new Promise((resolve) => {
                chrome.tabs.sendMessage(details.tabId, { action: 'scanDOM' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log("Could not scan DOM:", chrome.runtime.lastError.message);
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
        const result = await scanUrl(url, domData)

        // Store scan result
        chrome.storage.local.set({ lastScanResult: result })

        // Add to recent scans
        const { recentScans = [] } = await chrome.storage.local.get(['recentScans'])
        const newScan = {
            url,
            is_phishing: result.is_phishing,
            threat_level: result.threat_level,
            confidence: result.confidence,
            timestamp: new Date().toISOString()
        }
        recentScans.unshift(newScan)
        chrome.storage.local.set({ recentScans: recentScans.slice(0, 10) })

        // Update stats
        updateStats(result)

        // If phishing detected and blocking enabled with high confidence (> 0.7)
        if (result.is_phishing && settings.blockPhishing && result.confidence > 0.7) {
            // Show warning page
            const warningUrl = chrome.runtime.getURL('src/warning/warning.html') + '?url=' + encodeURIComponent(url)
            console.log('PhishBlocker: High-confidence threat detected, blocking:', warningUrl)

            chrome.tabs.update(details.tabId, {
                url: warningUrl
            })
        } else if (result.is_phishing && settings.showWarnings) {
            // Show notification
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: 'PhishBlocker Alert',
                message: `Potential phishing site detected: ${domain}`,
                priority: 2
            })
        }
    } catch (error) {
        console.error('Scan error:', error)
    }
})

// Scan URL function
async function scanUrl(url, domData = null) {
    try {
        const bodyPayload = {
            url: url,
            user_id: 'extension_user',
        };

        if (domData) {
            bodyPayload.dom_data = domData;
        }

        // Phase 3.1: Local Pre-flight Inference (Wasm)
        const localResult = await predictLocal(url);
        console.log('PhishBlocker: Local pre-flight result:', localResult);

        // If local model is extremely certain, we can potentially skip backend or prioritize
        if (localResult.is_phishing && localResult.probability > 0.95) {
            console.warn('PhishBlocker: High-confidence local block for:', url);
            return {
                url,
                is_phishing: true,
                confidence: localResult.probability,
                threat_level: 'critical',
                risk_factors: ['Local ML: High-confidence phishing detection'],
                method: 'local_wasm'
            };
        }

        // Check if API is reachable
        try {
            const healthCheck = await fetch(`${API_BASE_URL}/health`, { method: 'GET', signal: AbortSignal.timeout(2000) });
            if (!healthCheck.ok) throw new Error("API Unhealthy");
        } catch (e) {
            console.warn("PhishBlocker: API node unreachable, falling back to local heuristic heuristics:", e);
            // Fallback: If API is down, use local result if it was at least somewhat suspicious
            if (localResult.is_phishing && localResult.probability > 0.5) {
                return {
                    url,
                    is_phishing: true,
                    confidence: localResult.probability,
                    threat_level: 'medium',
                    risk_factors: ['Local Engine: Offline fallback detection'],
                    method: 'local_wasm'
                };
            }
            throw new Error("API Offline");
        }

        const response = await fetch(`${API_BASE_URL}/scan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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
        scanUrl(request.url).then(sendResponse)
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
