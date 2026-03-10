import * as ort from 'onnxruntime-web';
import { extractLexicalFeatures, prepareTensor } from './feature_extractor';

// Configure ONNX Runtime for Service Worker compatibility
// IMPORTANT: These MUST be set before calling any ort methods
ort.env.wasm.numThreads = 1;
ort.env.wasm.simd = false;

// Explicitly provide the path to the WASM files to avoid dynamic import() in SW context
const extensionRoot = chrome.runtime.getURL('/');
ort.env.wasm.wasmPaths = {
    'ort-wasm-simd.wasm': extensionRoot + 'ort-wasm-simd.wasm',
    'ort-wasm.wasm': extensionRoot + 'ort-wasm.wasm',
    'ort-wasm-threaded.wasm': extensionRoot + 'ort-wasm-threaded.wasm',
    'ort-wasm-simd-threaded.wasm': extensionRoot + 'ort-wasm-simd-threaded.wasm'
};

let session = null;
let modelLoaded = false;

/**
 * Initialize the ONNX session
 */
export const initLocalInference = async (modelPath = '/models/url_classifier.onnx') => {
    if (modelLoaded) return true;

    try {
        console.log('PhishBlocker: Loading local ML model from:', modelPath);
        // Use a static model path and force WASM provider
        session = await ort.InferenceSession.create(modelPath, {
            executionProviders: ['wasm'],
            graphOptimizationLevel: 'all'
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

        // Use dynamic input/output names from the session
        const inputName = session.inputNames[0];
        const outputName = session.outputNames[0];

        const feeds = { [inputName]: tensor };
        const results = await session.run(feeds);

        const output = results[outputName].data[0];
        console.log(`PhishBlocker: Inference result [${outputName}]:`, output);

        return {
            probability: Math.min(output, 0.98),
            is_phishing: output > 0.8, // High threshold for local pre-flight
            method: 'wasm'
        };
    } catch (e) {
        console.error('Local inference prediction failed:', e);
        return { probability: 0, is_phishing: false, method: 'error' };
    }
};
