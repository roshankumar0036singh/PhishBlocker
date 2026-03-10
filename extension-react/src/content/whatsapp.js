// Specialized content script for WhatsApp Web link protection
console.log('PhishBlocker: WhatsApp Forensic Protection Active');

let lastScannedUrl = null;

// Observe DOM changes to detect new messages
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type === 'childList') {
            findAndAnalyzeLinks(mutation.target);
        }
    }
});

function findAndAnalyzeLinks(root) {
    // WhatsApp message selectors can change, we targeting generic link patterns in message containers
    const links = root.querySelectorAll('a[href^="http"]');

    links.forEach(link => {
        if (link.dataset.phishblockerScanned) return;
        link.dataset.phishblockerScanned = 'true';

        const url = link.href;
        console.log(`PhishBlocker: Forensic scan initiated for WhatsApp link: ${url}`);

        // Send to background for neural analysis
        chrome.runtime.sendMessage({
            action: 'scanUrl',
            url: url
        }, (response) => {
            if (response && response.is_phishing) {
                applyThreatDecoration(link, response);
            }
        });
    });
}

function applyThreatDecoration(linkElement, data) {
    // Apply cinematic warning style to the link bubble
    linkElement.style.borderBottom = '2px dashed #ef4444';
    linkElement.style.color = '#ef4444';
    linkElement.style.fontWeight = 'bold';

    // Add a warning tooltip/badge
    const badge = document.createElement('span');
    badge.innerText = ' ⚠️ PHISHING DETECTED';
    badge.style.cssText = `
        font-size: 10px;
        background: #ef4444;
        color: black;
        padding: 2px 6px;
        border-radius: 4px;
        margin-left: 8px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    `;

    linkElement.parentElement.appendChild(badge);

    // Optional: Intercept click
    linkElement.addEventListener('click', (e) => {
        const proceed = confirm(`PhishBlocker SECURITY ALERT\n\nThis link is flagged as: ${data.threat_level}\nConfidence: ${(data.confidence * 100).toFixed(1)}%\n\nOur neural network highly recommends NOT visiting this site.\n\nProceed anyway?`);
        if (!proceed) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);
}

// Start observing the main application container
const config = { childList: true, subtree: true };
const targetNode = document.body; // WhatsApp Web is a single-page app
observer.observe(targetNode, config);

// Initial scan
findAndAnalyzeLinks(document.body);
