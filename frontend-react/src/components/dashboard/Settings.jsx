import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Shield, Save, CheckCircle, AlertTriangle, Cpu } from 'lucide-react';

const Settings = () => {
    const [apiKey, setApiKey] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState('idle'); // idle | success | error

    useEffect(() => {
        const savedKey = localStorage.getItem('GEMINI_API_KEY');
        if (savedKey) setApiKey(savedKey);
    }, []);

    const handleSave = () => {
        setIsSaving(true);
        setStatus('idle');

        // Simulate a slight delay for cinematic effect
        setTimeout(() => {
            try {
                localStorage.setItem('GEMINI_API_KEY', apiKey);
                setStatus('success');
            } catch (err) {
                setStatus('error');
            } finally {
                setIsSaving(false);
            }
        }, 800);
    };

    return (
        <div className="space-y-10">
            {/* Header Section */}
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-[2px] bg-accent-emerald shadow-[0_0_10px_#10b981]" />
                    <div className="text-[10px] font-black text-accent-emerald uppercase tracking-[0.5em]">Configuration Layer</div>
                </div>
                <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                    Command <span className="text-accent-emerald text-glow-emerald">Settings</span>
                </h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4 max-w-lg leading-relaxed">
                    Personalize your forensic neural matrix by integrating custom intelligence protocols.
                </p>
            </div>

            {/* API Key Configuration Card */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-12 rounded-[48px] border border-white/5 relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-1000">
                    <Cpu size={120} className="text-accent-emerald" />
                </div>

                <div className="flex items-center gap-6 mb-10">
                    <div className="p-5 bg-accent-emerald/10 rounded-2xl border border-accent-emerald/20">
                        <Key className="text-accent-emerald w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Gemini Intelligence Layer</h3>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Bring Your Own API Key (BYOAK)</p>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Secure API Token</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter your Google AI Studio API Key..."
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-gray-200 placeholder:text-gray-700 focus:outline-none focus:border-accent-emerald/50 transition-all duration-500 font-mono text-sm"
                            />
                            {status === 'success' && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-accent-emerald"
                                >
                                    <CheckCircle size={20} />
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-6 pt-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full md:w-auto px-10 py-5 bg-accent-emerald text-black font-black uppercase text-[11px] tracking-[0.2em] rounded-2xl hover:bg-white transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                    <Shield size={16} />
                                </motion.div>
                            ) : (
                                <Save size={16} />
                            )}
                            {isSaving ? 'Syncing...' : 'Save Configuration'}
                        </button>

                        <div className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.3em] flex items-center gap-3">
                            <AlertTriangle size={12} className="text-yellow-500/50" />
                            Stored locally in your secure browser enclave
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="glass-panel p-10 rounded-[40px] border border-white/5">
                    <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-4">Neural Architecture</h4>
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest leading-loose">
                        Your API key enables high-fidelity forensic analysis by leveraging the Gemini Flash synaptic engine. This process adds a layer of natural language reasoning to the core ML detection pipeline.
                    </p>
                </div>
                <div className="glass-panel p-10 rounded-[40px] border border-white/5">
                    <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-4">Privacy Protocol</h4>
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest leading-loose">
                        Keys are never transmitted to PhishBlocker's main telemetry servers. They are injected into the scan request locally and utilized only for the duration of the forensic probe.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Settings;
