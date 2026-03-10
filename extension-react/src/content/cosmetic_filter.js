/**
 * Cosmetic Filter Content Script
 * Hides ad placeholders and residual DOM elements.
 */

const AD_SELECTORS = [
    '.ad-container',
    '.adsbygoogle',
    '[id^="google_ads_iframe"]',
    '.fb-ad',
    '.sponsor-link',
    'iframe[src*="doubleclick.net"]',
    '.ad-unit',
    '.promotion-banner'
];

function hideAds() {
    const elements = document.querySelectorAll(AD_SELECTORS.join(','));
    elements.forEach(el => {
        if (el.style.display !== 'none') {
            el.style.display = 'none';
            // Notify background for stats (throttled)
            notifyAdRemoval();
        }
    });
}

// Throttled notification
let lastNotifyTime = 0;
function notifyAdRemoval() {
    const now = Date.now();
    if (now - lastNotifyTime > 5000) { // Every 5 seconds max
        chrome.runtime.sendMessage({ action: 'adRemovedCosmetically' });
        lastNotifyTime = now;
    }
}

// Initial sweep
hideAds();

// Mutation observer for dynamic content
const observer = new MutationObserver((mutations) => {
    hideAds();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('PhishBlocker: Cosmetic filtering active.');
