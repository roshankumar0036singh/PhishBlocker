/**
 * Lightweight Lexical Feature Extractor for Browser
 * Extracts basic URL features for pre-flight local inference
 */

export const extractLexicalFeatures = (url) => {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        const path = urlObj.pathname;
        const query = urlObj.search;

        return {
            url_length: url.length,
            domain_length: domain.length,
            path_length: path.length,
            num_dots: (url.match(/\./g) || []).length,
            num_hyphens: (url.match(/-/g) || []).length,
            num_slashes: (url.match(/\//g) || []).length,
            num_question_marks: (url.match(/\?/g) || []).length,
            num_ampersands: (url.match(/&/g) || []).length,
            num_digits: (url.match(/\d/g) || []).length,
            is_https: urlObj.protocol === 'https:' ? 1 : 0,
            has_ip: /^\d{1,3}(\.\d{1,3}){3}$/.test(domain) ? 1 : 0,
            num_subdomains: (domain.match(/\./g) || []).length,
            is_shortening: /bit\.ly|goo\.gl|t\.co|tinyurl|is\.gd|cli\.gs|yfrog/.test(domain) ? 1 : 0,
            suspicious_keywords: /login|verify|update|account|secure|banking|ebayisapi|webscr|cmd|signin/.test(url.toLowerCase()) ? 1 : 0
        };
    } catch (e) {
        console.error('Feature extraction failed:', e);
        return null;
    }
};

/**
 * Convert features to a flat array/tensor for ONNX
 */
export const prepareTensor = (features) => {
    // Order must match the training script: 
    // [url_length, domain_length, num_dots, num_hyphens, num_digits, is_https, has_ip, num_subdomains, is_shortening, suspicious_keywords]
    // (Simplified subset for common lightweight models)
    return new Float32Array([
        features.url_length,
        features.domain_length,
        features.num_dots,
        features.num_hyphens,
        features.num_digits,
        features.is_https,
        features.has_ip,
        features.num_subdomains,
        features.is_shortening,
        features.suspicious_keywords
    ]);
};
