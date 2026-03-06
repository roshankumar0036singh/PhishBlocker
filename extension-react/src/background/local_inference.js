import * as ort from 'onnxruntime-web';
import { extractLexicalFeatures, prepareTensor } from './feature_extractor';

// Configure ONNX Runtime for Service Worker compatibility static context
// Disable multithreading, proxy, and SIMD which can cause dynamic import errors in Service Workers (Manifest V3)
ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;
ort.env.wasm.simd = false;

// Use absolute extension URLs for Wasm binaries
const wasmPath = chrome.runtime.getURL('/');
ort.env.wasm.wasmPaths = wasmPath;

let session = null;
let modelLoaded = false;

/**
 * Initialize the ONNX session
 */
export const initLocalInference = async (modelPath = '/models/url_classifier.onnx') => {
    if (modelLoaded) return true;

    try {
        console.log('PhishBlocker: Loading local ML model from:', modelPath);
        session = await ort.InferenceSession.create(modelPath, {
            executionProviders: ['wasm']
        });
        modelLoaded = true;
        console.log('PhishBlocker: Local ML model loaded successfully');
        return true;
    } catch (e) {
        console.warn('PhishBlocker: Failed to load local ML model, using heuristic fallback:', e);
        return false;
    }
};

/**
 * Perform local inference on a URL
 */
export const predictLocal = async (url) => {
    const features = extractLexicalFeatures(url);
    if (!features) return { probability: 0, is_phishing: false, method: 'none' };

    // Heuristic Fallback logic if model fails
    if (!modelLoaded) {
        let score = 0;
        if (features.has_ip) score += 0.4;
        if (features.is_shortening) score += 0.3;
        if (features.suspicious_keywords) score += 0.3;
        if (features.num_dots > 4) score += 0.2;
        if (features.domain_length > 40) score += 0.2;
        if (!features.is_https) score += 0.1;

        const normalizedScore = Math.min(score, 1.0);
        return {
            probability: normalizedScore,
            is_phishing: normalizedScore > 0.7,
            method: 'heuristic'
        };
    }

    try {
        const inputData = prepareTensor(features);
        const tensor = new ort.Tensor('float32', inputData, [1, 10]); // Batch size 1, 10 features

        const feeds = { input: tensor };
        const results = await session.run(feeds);

        const output = results.output.data[0]; // Assuming output is 'output' and single float
        return {
            probability: output,
            is_phishing: output > 0.8, // High threshold for local pre-flight
            method: 'wasm'
        };
    } catch (e) {
        console.error('Local inference prediction failed:', e);
        return { probability: 0, is_phishing: false, method: 'error' };
    }
};
