
/**
 * PhishBlocker: Search HUD (Pre-Scan)
 * Injects real-time risk scores into Google/Bing/DuckDuckGo results
 */

async function injectSearchHUD() {
    const isGoogle = window.location.hostname.includes('google');
    const isBing = window.location.hostname.includes('bing');
    const isDuckDuckGo = window.location.hostname.includes('duckduckgo');

    if (!isGoogle && !isBing && !isDuckDuckGo) return;

    const selectors = {
        google: 'div.g a[href^="http"]',
        bing: 'li.b_algo h2 a[href^="http"]',
        duckduckgo: 'article h2 a[href^="http"]'
    };

    const targetSelector = isGoogle ? selectors.google : (isBing ? selectors.bing : selectors.duckduckgo);
    const links = Array.from(document.querySelectorAll(targetSelector)).filter(link => {
        // Skip links that are internal or already processed
        return !link.dataset.phishblockerProcessed &&
            !link.href.includes(window.location.hostname);
    });

    for (const link of links) {
        link.dataset.phishblockerProcessed = 'true';
        fetchRiskScore(link);
    }
}

async function fetchRiskScore(linkElement) {
    try {
        const url = linkElement.href;
        const apiBase = "http://localhost:8000";

        // Use a background message to avoid CORS issues if necessary, 
        // but for localhost dev we can try direct fetch
        const response = await fetch(`${apiBase}/api/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url })
        });

        const data = await response.json();
        renderShield(linkElement, data);
    } catch (e) {
        // Silently fail for search HUD to avoid cluttering logs
    }
}

function renderShield(element, data) {
    const shield = document.createElement('span');
    shield.className = 'phishblocker-shield-hud';

    let color = '#10b981'; // Safe (Green)
    if (data.is_phishing) {
        color = '#ef4444'; // Threat (Red)
    } else if (data.confidence > 0.4) {
        color = '#f59e0b'; // Caution (Orange)
    }

    shield.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: middle;">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
    `;

    element.prepend(shield);
}

// Observe for dynamic content (infinite scroll)
const observer = new MutationObserver(() => {
    injectSearchHUD();
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial trigger
injectSearchHUD();
