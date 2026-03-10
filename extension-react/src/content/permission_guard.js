/**
 * Permission Guard Content Script
 * Intercepts browser permission requests to detect "Contextual Anomaly" (Phase 53)
 */

(function () {
    // Helper to send permission events to the background
    function notifyPermissionRequest(type, details = {}) {
        chrome.runtime.sendMessage({
            action: 'PERMISSION_REQUESTED',
            permissionType: type,
            url: window.location.href,
            hostname: window.location.hostname,
            timestamp: new Date().toISOString(),
            details: details
        });
    }

    // 1. Wrap navigator.permissions.query
    if (navigator.permissions && navigator.permissions.query) {
        const originalQuery = navigator.permissions.query;
        navigator.permissions.query = function (descriptor) {
            notifyPermissionRequest(descriptor.name, { method: 'navigator.permissions.query' });
            return originalQuery.apply(this, arguments);
        };
    }

    // 2. Wrap navigator.mediaDevices.getUserMedia (Camera/Mic)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
        navigator.mediaDevices.getUserMedia = function (constraints) {
            const types = [];
            if (constraints.video) types.push('camera');
            if (constraints.audio) types.push('microphone');

            types.forEach(type => notifyPermissionRequest(type, { method: 'getUserMedia', constraints }));
            return originalGetUserMedia.apply(this, arguments);
        };
    }

    // 3. Wrap navigator.geolocation.getCurrentPosition
    if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
        const originalGetPos = navigator.geolocation.getCurrentPosition;
        navigator.geolocation.getCurrentPosition = function () {
            notifyPermissionRequest('geolocation', { method: 'getCurrentPosition' });
            return originalGetPos.apply(this, arguments);
        };
    }

    console.log('PhishBlocker: Permission Guard Active');
})();
