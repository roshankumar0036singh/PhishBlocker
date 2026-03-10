// Content script for PhishBlocker
// This script runs on all web pages

console.log('PhishBlocker content script loaded')

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showWarning') {
    showWarningOverlay(request.data)
  } else if (request.action === 'scanDOM') {
    const domAnalysis = analyzeDOM();
    sendResponse(domAnalysis);
  }
  return true; // Keep message channel open for async responses if needed
})

// Analyze DOM for phishing indicators
function analyzeDOM() {
  console.log('PhishBlocker: Analyzing DOM for threats...');
  const result = {
    has_password_field: false,
    num_iframes: 0,
    hidden_iframes: 0,
    page_title: document.title,
    scripts_count: 0,
    suspicious_scripts: 0,
    brand_indicators: [],
    page_text: document.body.innerText.substring(0, 2000),
    meta_description: document.querySelector('meta[name="description"]')?.content || ''
  };

  // Check for password fields
  const passwordFields = document.querySelectorAll('input[type="password"]');
  result.has_password_field = passwordFields.length > 0;

  // Check for iframes
  const iframes = document.querySelectorAll('iframe');
  result.num_iframes = iframes.length;

  // Count hidden iframes (often used for malicious purposes)
  iframes.forEach(iframe => {
    const style = window.getComputedStyle(iframe);
    if (style.display === 'none' || style.visibility === 'hidden' ||
      style.opacity === '0' || iframe.width === '0' || iframe.height === '0') {
      result.hidden_iframes++;
    }
  });

  // Check scripts
  const scripts = document.querySelectorAll('script');
  result.scripts_count = scripts.length;
  scripts.forEach(script => {
    // Look for obfuscated eval or suspicious external domains
    if (script.innerHTML.includes('eval(') || script.innerHTML.includes('unescape(')) {
      result.suspicious_scripts++;
    }
  });

  // Brand indicators (Naive logo checking)
  const images = document.querySelectorAll('img');
  const commonBrands = ['microsoft', 'paypal', 'apple', 'google', 'facebook', 'amazon'];
  images.forEach(img => {
    const altText = (img.alt || '').toLowerCase();
    const srcText = (img.src || '').toLowerCase();

    commonBrands.forEach(brand => {
      if ((altText.includes(brand) || srcText.includes(brand)) && !result.brand_indicators.includes(brand)) {
        result.brand_indicators.push(brand);
      }
    });
  });

  // Check for Form Hijacking
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    try {
      const actionUrl = new URL(form.action || window.location.href, window.location.href);
      if (actionUrl.hostname && actionUrl.hostname !== window.location.hostname && !isWhitelisted(actionUrl.hostname)) {
        result.brand_indicators.push(`suspicious_form_action:${actionUrl.hostname}`);
        // Highlight suspicious forms
        form.style.border = '2px solid red';
        form.title = 'Warning: This form sends data to an external domain.';
      }
    } catch (e) { }
  });

  return result;
}

// Check if a domain is a known safe data processor
function isWhitelisted(hostname) {
  const commonProcessors = ['google.com', 'facebook.com', 'stripe.com', 'paypal.com', 'microsoft.com'];
  return commonProcessors.some(trusted => hostname.endsWith(trusted));
}

// Keylogger & Sensitive Input Monitoring
function monitorSensitiveInputs() {
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  passwordInputs.forEach(input => {
    // Only attach once
    if (input.dataset.phishblockerMonitored) return;
    input.dataset.phishblockerMonitored = 'true';

    input.addEventListener('input', (e) => {
      if (!e.isTrusted) {
        console.warn('PhishBlocker: Untrusted input event detected on password field!');
        showToast('Warning: Automated input detected on password field!', 'warning');
      }
    });

    // Check for "Paste" hijacking or large pastes
    input.addEventListener('paste', (e) => {
      const pasteData = (e.clipboardData || window.clipboardData).getData('text');
      if (pasteData.length > 100) {
        showToast('Large amount of data pasted into password field.', 'info');
      }
    });
  });
}

// Simple toast notification for content script
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'warning' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 10px;
    z-index: 1000000;
    font-family: sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    transition: opacity 0.5s;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

// Re-run monitoring periodically or on DOM changes
setInterval(monitorSensitiveInputs, 2000);
monitorSensitiveInputs();

// Show warning overlay
function showWarningOverlay(data) {
  // Create overlay
  const overlay = document.createElement('div')
  overlay.id = 'phishblocker-warning'
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `

  overlay.innerHTML = `
    <div style="
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    ">
      <div style="
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        border-radius: 50%;
        margin: 0 auto 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2s infinite;
      ">
        <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
          <path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
        </svg>
      </div>
      
      <h1 style="
        font-size: 28px;
        font-weight: bold;
        color: #1f2937;
        margin: 0 0 10px 0;
      ">
        ⚠️ Phishing Warning
      </h1>
      
      <p style="
        font-size: 16px;
        color: #6b7280;
        margin: 0 0 20px 0;
        line-height: 1.6;
      ">
        PhishBlocker has detected that this website may be attempting to steal your personal information.
      </p>
      
      <div style="
        background: #fef2f2;
        border: 2px solid #fecaca;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 24px;
        text-align: left;
      ">
        <p style="
          font-size: 14px;
          color: #991b1b;
          margin: 0 0 8px 0;
          font-weight: 600;
        ">
          Threat Level: <span style="color: #dc2626;">${data.threat_level}</span>
        </p>
        <p style="
          font-size: 14px;
          color: #991b1b;
          margin: 0;
        ">
          Confidence: <span style="color: #dc2626;">${(data.confidence * 100).toFixed(1)}%</span>
        </p>
      </div>
      
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="phishblocker-back" style="
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        ">
          ← Go Back to Safety
        </button>
        
        <button id="phishblocker-proceed" style="
          background: transparent;
          color: #6b7280;
          border: 2px solid #d1d5db;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        ">
          Proceed Anyway
        </button>
      </div>
    </div>
    
    <style>
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      #phishblocker-back:hover {
        transform: translateY(-2px);
      }
      
      #phishblocker-proceed:hover {
        background: #f3f4f6;
        border-color: #9ca3af;
      }
    </style>
  `

  document.body.appendChild(overlay)

  // Add event listeners
  document.getElementById('phishblocker-back').addEventListener('click', () => {
    window.history.back()
  })

  document.getElementById('phishblocker-proceed').addEventListener('click', () => {
    overlay.remove()
  })
}
