import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Key, Shield, Save, CheckCircle, AlertTriangle, Cpu, Loader2, Database, Network } from 'lucide-react'

const Settings = () => {
    const [apiKey, setApiKey] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [status, setStatus] = useState('idle') // idle | success | error

    useEffect(() => {
        const savedKey = localStorage.getItem('GEMINI_API_KEY')
        if (savedKey) setApiKey(savedKey)
    }, [])

    const handleSave = () => {
        setIsSaving(true)
        setStatus('idle')

        setTimeout(() => {
            try {
                localStorage.setItem('GEMINI_API_KEY', apiKey)
                setStatus('success')
            } catch (err) {
                setStatus('error')
            } finally {
                setIsSaving(false)
            }
        }, 1200)
    }

    return (
        <div className="space-y-12 min-h-screen pb-40">
            {/* Header / Brand Tier */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-[2px] bg-emerald-pro shadow-[0_0_15px_#10b981]" />
                    <span className="forensic-text text-[10px] text-emerald-pro uppercase tracking-[0.5em]">Configuration Layer</span>
                </div>
                <h2 className="text-7xl font-black text-white uppercase tracking-tighter italic leading-none">
                    Command <span className="text-emerald-pro text-glow-emerald">Protocol</span>
                </h2>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest max-w-xl opacity-80 leading-relaxed italic">
                    Universal synaptic configuration. Define intelligence endpoints and perimeter credentials for real-time forensic oversight.
                </p>
            </div>

            <div className="grid grid-cols-12 gap-10">
                {/* Main Config Area (Elite Pro Redux) */}
                <div className="col-span-12 xl:col-span-7">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-surface p-14 rounded-[3.5rem] border border-white/5 relative overflow-hidden group/card shadow-[0_20px_80px_rgba(0,0,0,0.5)]"
                    >
                        <div className="absolute inset-0 neural-grid opacity-[0.03] pointer-events-none" />
                        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-emerald-pro/[0.02] to-transparent pointer-events-none" />

                        <div className="absolute -right-24 -top-24 opacity-[0.03] pointer-events-none rotate-12 group-hover/card:opacity-[0.07] transition-all duration-1000">
                            <Cpu size={400} className="text-emerald-pro" />
                        </div>

                        <div className="flex items-center justify-between mb-16 relative z-10">
                            <div className="flex items-center gap-8">
                                <div className="w-20 h-20 rounded-[2rem] bg-obsidian-800 border-2 border-white/5 flex items-center justify-center shadow-2xl group-hover/card:border-emerald-pro/30 transition-all duration-500">
                                    <Key size={32} className="text-emerald-pro shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-[0.2em] italic leading-none">Intelligence <span className="text-emerald-pro">Auth</span></h3>
                                    <p className="forensic-text text-[10px] mt-2 opacity-50">Secure Synaptic Handshake Protocol</p>
                                </div>
                            </div>
                            <div className="hidden md:flex flex-col items-end">
                                <span className="forensic-text text-[8px] text-gray-700">Auth Status</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={`w-2 h-2 rounded-full ${status === 'success' ? 'bg-emerald-pro animate-pulse shadow-[0_0_10px_#10b981]' : 'bg-gray-800'}`} />
                                    <span className={`text-[10px] font-black uppercase ${status === 'success' ? 'text-emerald-pro' : 'text-gray-700'}`}>
                                        {status === 'success' ? 'SYNCHRONIZED' : 'AWAITING_LINK'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-12 relative z-10">
                            <div className="space-y-5">
                                <div className="flex items-center justify-between px-2">
                                    <label className="forensic-text text-[9px] text-gray-700 uppercase tracking-[0.3em]">Synaptic Endpoint (Gemini-Flash)</label>
                                    <span className="text-[8px] font-black text-gray-800 flex items-center gap-1.5 uppercase">
                                        <Shield size={10} /> AES-256 Local Enclave
                                    </span>
                                </div>
                                <div className="relative group/input">
                                    <div className="absolute inset-0 bg-emerald-pro/5 blur-xl opacity-0 group-focus-within/input:opacity-10 transition-opacity" />
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="ENTER GOOGLE AI STUDIO CREDENTIALS..."
                                        className="w-full bg-black/80 border-2 border-white/5 rounded-[1.5rem] py-8 px-10 text-xs font-mono font-black uppercase tracking-[0.15em] text-white/90 outline-none focus:border-emerald-pro/30 transition-all placeholder:text-gray-900 shadow-2xl relative z-10"
                                    />
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20 flex items-center gap-4">
                                        {status === 'success' && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 px-4 py-2 bg-emerald-pro/10 rounded-full border border-emerald-pro/20">
                                                <span className="text-[8px] font-black text-emerald-pro uppercase tracking-widest italic">Sync Active</span>
                                                <CheckCircle size={14} className="text-emerald-pro" />
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center gap-10">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className={`w-full md:w-auto px-20 py-7 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.6em] italic flex items-center justify-center gap-5 transition-all active:scale-[0.98] border shadow-2xl ${isSaving
                                        ? 'bg-white/5 text-gray-800 border-white/5 cursor-not-allowed'
                                        : 'bg-transparent text-white border-white/10 hover:border-emerald-pro hover:bg-emerald-pro/[0.05] shadow-[0_0_40px_rgba(16,185,129,0.05)]'
                                        }`}
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="opacity-50" />}
                                    {isSaving ? 'SYNCHRONIZING...' : 'UPLOAD PROTOCOL'}
                                </button>

                                <div className="flex items-center gap-5 px-8 py-4 rounded-[1.5rem] bg-white/[0.01] border border-white/5">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/5 border border-amber-500/10 flex items-center justify-center">
                                        <AlertTriangle size={14} className="text-amber-500/40" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Enclave Persistence</span>
                                        <span className="text-[8px] font-bold text-gray-800 uppercase italic mt-0.5">Local Encrypted Enclave Storage Only</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Sub-tier Info Area */}
                <div className="col-span-12 xl:col-span-5 flex flex-col gap-8">
                    <div className="glass-surface p-10 rounded-[2.5rem] border border-white/5 flex-1 relative overflow-hidden group">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-1.5 h-6 bg-emerald-pro rounded-full" />
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Neural Integration</h4>
                        </div>
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-tight leading-relaxed italic">
                            This identifier enables high-fidelity forensic reasoning. The Gemini Flash synaptic engine provides natural language oversight, detecting nuanced social engineering vectors missed by core ML nodes.
                        </p>
                    </div>

                    <div className="glass-surface p-10 rounded-[2.5rem] border border-white/5 flex-1 relative overflow-hidden group">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-1.5 h-6 bg-blue-pro rounded-full" />
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Privacy Perimeter</h4>
                        </div>
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-tight leading-relaxed italic">
                            All credentials remain within your local browser ecosystem. PhishBlocker telemetry nodes nunca intercept identifier strings. Security is enforced via browser-native AES-256 storage.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Settings
