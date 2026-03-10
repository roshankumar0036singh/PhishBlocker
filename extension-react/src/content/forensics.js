
/**
 * PhishBlocker: Age of Origin Alert
 * Displays a badge for freshly registered domains (< 48h)
 */

async function checkDomainAge() {
    try {
        const url = window.location.href;
        if (!url.startsWith('http')) return;

        const domain = new URL(url).hostname;
        const apiBase = "http://localhost:8000";

        const response = await fetch(`${apiBase}/api/domain/age?url=${encodeURIComponent(url)}`);
        const data = await response.json();

        if (data.status === 'success' && data.is_fresh) {
            injectAgeBadge(data.age_days);
        }
    } catch (e) {
        console.error("PhishBlocker: Age check failed", e);
    }
}

function injectAgeBadge(days) {
    const badge = document.createElement('div');
    badge.id = 'phishblocker-age-badge';
    badge.innerHTML = `
        <div style="display: flex; items-center: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            <span style="font-weight: 800; letter-spacing: 0.05em;">FRESH DOMAIN: ${days}H OLD</span>
        </div>
    `;

    Object.assign(badge.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '999999',
        backgroundColor: '#ef4444',
        color: 'white',
        padding: '10px 16px',
        borderRadius: '12px',
        fontSize: '11px',
        fontFamily: 'Montserrat, sans-serif',
        boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        cursor: 'pointer',
        animation: 'phishblocker-slide-in 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        alignItems: 'center'
    });

    const style = document.createElement('style');
    style.textContent = `
        @keyframes phishblocker-slide-in {
            from { transform: translateX(120%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    badge.onclick = () => badge.remove();
    document.body.appendChild(badge);
}

// Initial trigger
if (document.readyState === 'complete') {
    checkDomainAge();
} else {
    window.addEventListener('load', checkDomainAge);
}
