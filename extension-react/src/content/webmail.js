
/**
 * PhishBlocker: Email Header Forensic Scanner
 * SPF/DKIM/DMARC validation tool for Webmail (Gmail/Outlook)
 */

async function injectForensicButton() {
    const isGmail = window.location.hostname.includes('mail.google.com');
    const isOutlook = window.location.hostname.includes('outlook');

    if (isGmail) {
        // Find Gmail header container
        const headerArea = document.querySelector('div.adn.ads');
        if (headerArea && !headerArea.querySelector('.phishblocker-forensic-btn')) {
            addButton(headerArea, 'Gmail');
        }
    } else if (isOutlook) {
        // Find Outlook header container
        const headerArea = document.querySelector('div[role="main"] div[data-app-section="ConversationContainer"]');
        if (headerArea && !headerArea.querySelector('.phishblocker-forensic-btn')) {
            addButton(headerArea, 'Outlook');
        }
    }
}

function addButton(container, platform) {
    const btn = document.createElement('button');
    btn.className = 'phishblocker-forensic-btn';
    btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="m12 14 4-4"/><path d="m3.34 19 8.66-8.66"/><path d="m16.6 5.4 3.4 3.4"/><path d="m6.4 16.6 3.4 3.4"/><path d="m19 14-4-4"/></svg>
        INSPECT SENDER
    `;

    Object.assign(btn.style, {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 12px',
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '10px',
        fontWeight: '800',
        cursor: 'pointer',
        margin: '10px 0',
        fontFamily: 'Montserrat, sans-serif',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
    });

    btn.onclick = (e) => {
        e.stopPropagation();
        runForensics(platform);
    };

    container.prepend(btn);
}

async function runForensics(platform) {
    try {
        let senderEmail = "";
        if (platform === 'Gmail') {
            const emailSpan = document.querySelector('span.gD');
            senderEmail = emailSpan?.getAttribute('email') || "";
        } else {
            const emailSpan = document.querySelector('div[data-auth-id="sender-link"]');
            senderEmail = emailSpan?.innerText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || "";
        }

        if (!senderEmail) {
            alert("Could not identify sender email.");
            return;
        }

        const domain = senderEmail.split('@')[1];
        const apiBase = "http://localhost:8000";

        const response = await fetch(`${apiBase}/api/forensics/email?domain=${domain}`);
        const data = await response.json();

        showForensicResult(data);
    } catch (e) {
        console.error("Forensics failed", e);
    }
}

function showForensicResult(data) {
    const resultDiv = document.createElement('div');
    resultDiv.id = 'phishblocker-forensic-report';

    const isSafe = data.risk_level === 'low';
    const color = isSafe ? '#10b981' : '#ef4444';

    resultDiv.innerHTML = `
        <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 900; font-size: 14px; letter-spacing: -0.02em;">SENDER INTELLIGENCE</span>
            <span style="background: ${color}33; color: ${color}; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 900;">${data.risk_level.toUpperCase()} RISK</span>
        </div>
        <div style="space-y: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
                <span style="color: #6b7280;">SPF Record</span>
                <span style="color: ${data.spf.status === 'valid' ? '#10b981' : '#ef4444'}; font-weight: 700;">${data.spf.status.toUpperCase()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 4px;">
                <span style="color: #6b7280;">DMARC Policy</span>
                <span style="color: ${data.dmarc.status === 'valid' ? '#10b981' : '#ef4444'}; font-weight: 700;">${data.dmarc.status.toUpperCase()}</span>
            </div>
        </div>
        <div style="margin-top: 12px; font-size: 10px; color: #9ca3af; border-top: 1px solid rgba(255,255,255,0.05); pt: 8px;">
            Domain: ${data.domain}
        </div>
        <button id="close-forensics" style="width: 100%; margin-top: 12px; background: rgba(255,255,255,0.05); border: none; color: white; padding: 6px; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: 700;">CLOSE</button>
    `;

    Object.assign(resultDiv.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: '1000000',
        backgroundColor: '#0a0a0a',
        color: 'white',
        padding: '24px',
        borderRadius: '20px',
        width: '300px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        fontFamily: 'Montserrat, sans-serif'
    });

    document.body.appendChild(resultDiv);
    document.getElementById('close-forensics').onclick = () => resultDiv.remove();
}

// Observe for dynamic content
const webmailObserver = new MutationObserver(injectForensicButton);
webmailObserver.observe(document.body, { childList: true, subtree: true });
