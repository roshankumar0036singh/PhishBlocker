import { useState } from 'react'
import { Search, Zap, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function URLScanner() {
    const [url, setUrl] = useState('')
    const [scanning, setScanning] = useState(false)
    const [result, setResult] = useState(null)

    const handleScan = async (e) => {
        e.preventDefault()
        if (!url) return

        setScanning(true)
        setResult(null)

        try {
            const gemini_api_key = localStorage.getItem('GEMINI_API_KEY')
            const response = await fetch(`${API_URL}/api/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url,
                    user_id: 'dashboard_user',
                    gemini_api_key: gemini_api_key || undefined
                })
            })

            if (response.ok) {
                const data = await response.json()
                setResult(data)
            } else {
                setResult({ error: 'Tactical intercept failed. Node offline.' })
            }
        } catch (error) {
            console.error('Scan error:', error)
            setResult({ error: 'Neural link severed. Verify API gateway.' })
        } finally {
            setScanning(false)
        }
    }

    return (
        <div className="glass-panel rounded-[48px] p-10 relative overflow-hidden group h-full flex flex-col">
            {/* Background Decorative Icons */}
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                <Search size={120} className="text-white" />
            </div>

            <div className="flex items-center gap-6 mb-12">
                <div className="p-5 bg-accent-emerald/10 rounded-2xl border border-accent-emerald/20 neural-glow">
                    <Zap className="w-7 h-7 text-accent-emerald" />
                </div>
                <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">
                        Interceptor Hub
                    </h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1.5 leading-relaxed">Manual Neural Vector Probe Gateway</p>
                </div>
            </div>

            <form onSubmit={handleScan} className="space-y-10 relative z-10">
                <div className="relative group/input">
                    <label className="block text-[10px] font-black text-white uppercase tracking-[0.3em] mb-5 ml-2 opacity-50">
                        Target Vector Identifier (URL)
                    </label>
                    <div className="relative">
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="HTTPS://DETECT-PHISH.PB"
                            className="w-full bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-3xl py-7 px-8 outline-none focus:border-accent-emerald/40 text-xs font-black uppercase tracking-widest transition-all placeholder:text-gray-800 text-white shadow-inner"
                            required
                        />
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-800 group-focus-within/input:text-accent-emerald transition-colors">
                            <Search size={20} />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={scanning || !url}
                    className={`w-full py-7 px-10 rounded-3xl font-black text-[13px] uppercase tracking-[0.4em] flex items-center justify-center gap-5 transition-all active:scale-[0.97] relative overflow-hidden group/btn ${scanning || !url
                        ? 'bg-white/5 text-gray-700 cursor-not-allowed border border-white/5 opacity-50'
                        : 'bg-accent-emerald text-night-400 hover:shadow-[0_0_50px_#10b98144]'
                        }`}
                >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-10 transition-opacity" />
                    {scanning ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            ANALYZING VECTOR...
                        </>
                    ) : (
                        <>
                            <Zap size={20} fill="currentColor" />
                            TRIGGER LIVE SCAN
                        </>
                    )}
                </button>
            </form>

            <AnimatePresence mode="wait">
                {scanning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-12 flex-grow flex flex-col items-center justify-center p-12 bg-white/[0.01] border border-white/5 rounded-[40px] relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(16,185,129,0.05)_50%,transparent_100%)] w-[200%] animate-[shimmer_2s_infinite_linear]" />
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-20 h-20 mb-6 relative">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border-t-2 border-r-2 border-accent-emerald/40 rounded-full"
                                />
                                <div className="absolute inset-4 border-b-2 border-l-2 border-accent-emerald/20 rounded-full animate-reverse-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-accent-emerald rounded-full animate-pulse" />
                                </div>
                            </div>
                            <div className="text-[10px] font-black text-accent-emerald uppercase tracking-[0.5em] animate-pulse">Deep Frame Inspection</div>
                        </div>
                    </motion.div>
                )}

                {result && !scanning && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="mt-12 flex-grow min-h-0 overflow-y-auto custom-scrollbar pr-2"
                    >
                        {result.error ? (
                            <div className="p-10 bg-red-500/5 border border-red-500/20 rounded-[40px] relative overflow-hidden group">
                                <div className="flex items-center gap-6">
                                    <div className="p-5 bg-red-500/15 rounded-2xl text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                                        <AlertTriangle size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.3em] mb-2">Protocol Intercepted</h4>
                                        <p className="text-[11px] font-bold text-red-400/60 uppercase leading-relaxed tracking-wider">{result.error}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={`p-10 rounded-[40px] border relative overflow-hidden group transition-all duration-1000 ${result.is_phishing
                                ? 'bg-red-500/5 border-red-500/20 shadow-[0_0_60px_rgba(239,68,68,0.05)]'
                                : 'bg-accent-emerald/5 border-accent-emerald/20 shadow-[0_0_60px_rgba(16,185,129,0.05)]'
                                }`}>
                                <div className="absolute -right-4 -bottom-4 w-40 h-40 blur-[80px] rounded-full opacity-20"
                                    style={{ background: result.is_phishing ? '#ef4444' : '#10b981' }} />

                                <div className="flex flex-col relative z-10">
                                    <div className="flex items-start justify-between mb-10">
                                        <div className="flex items-center gap-6">
                                            <div className={`p-5 rounded-2xl shadow-lg border ${result.is_phishing ? 'bg-red-500/20 border-red-500/30 text-red-500' : 'bg-accent-emerald/20 border-accent-emerald/30 text-accent-emerald'}`}>
                                                {result.is_phishing ? <AlertTriangle size={32} /> : <CheckCircle size={32} />}
                                            </div>
                                            <div>
                                                <h4 className={`text-xl font-black uppercase tracking-[0.4em] leading-none mb-3 ${result.is_phishing ? 'text-red-500 text-glow-red' : 'text-accent-emerald text-glow-emerald'}`}>
                                                    {result.is_phishing ? 'Malicious' : 'Sterile'}
                                                </h4>
                                                <div className="text-[9px] font-black text-gray-500 uppercase tracking-[0.5em]">Forensic Classification</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-8">
                                        <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 mb-3">Neural Integrity</div>
                                            <div className="text-2xl font-black text-white font-mono tracking-tighter">
                                                {(result.confidence * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                        <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 mb-3">Threat Vector</div>
                                            <div className={`text-2xl font-black font-mono tracking-tighter ${result.is_phishing ? 'text-red-500' : 'text-accent-emerald'}`}>
                                                {result.threat_level || 'CLEAN'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Deep Analysis Content */}
                                    <div className="space-y-6">
                                        {result.llm_analysis && (
                                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald" />
                                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Synaptic Context</span>
                                                </div>
                                                <p className="text-[11px] font-bold text-gray-400 leading-relaxed uppercase tracking-tight">
                                                    {typeof result.llm_analysis === 'string' ? result.llm_analysis : result.llm_analysis.analysis}
                                                </p>
                                            </div>
                                        )}

                                        {result.risk_factors && result.risk_factors.length > 0 && (
                                            <div>
                                                <div className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] mb-4 pl-2">Risk Telemetry</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {result.risk_factors.map((factor, i) => (
                                                        <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">
                                                            {factor}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default URLScanner
