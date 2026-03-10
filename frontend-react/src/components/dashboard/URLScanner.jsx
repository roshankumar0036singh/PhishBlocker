import { useState, useEffect, useRef } from 'react'
import { Search, Zap, Loader2, AlertTriangle, CheckCircle, Terminal, Shield, Wifi, Globe, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function URLScanner() {
    const [url, setUrl] = useState('')
    const [scanning, setScanning] = useState(false)
    const [result, setResult] = useState(null)
    const [logs, setLogs] = useState([])
    const terminalRef = useRef(null)

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight
        }
    }, [logs])

    const handleScan = async (e) => {
        e.preventDefault()
        if (!url) return

        setScanning(true)
        setResult(null)
        setLogs([
            { msg: 'INIT_AUTH_SYNC [PB-OS-2.4]', type: 'sys' },
            { msg: 'ESTABLISHING NEURAL LINK...', type: 'sys' },
            { msg: 'TARGET_VECTOR: ' + url, type: 'info' },
            { msg: 'EXTRACTING DOM_METRICS...', type: 'sys' },
            { msg: 'ENFORCING ZERO_TRUST_POLICY...', type: 'sys' }
        ])

        try {
            const gemini_api_key = localStorage.getItem('GEMINI_API_KEY')

            // Artificial delay for forensic feel
            await new Promise(r => setTimeout(r, 800));
            setLogs(prev => [...prev, { msg: 'RESOLVING_GLOBAL_INTEL...', type: 'sys' }]);

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
                setLogs(prev => [...prev, { msg: 'SCAN_COMPLETE: DATA_READY', type: 'success' }]);
                setResult(data)
            } else {
                setLogs(prev => [...prev, { msg: 'NODE_TIMEOUT: INTERCEPT_FAILED', type: 'error' }]);
                setResult({ error: 'Tactical intercept failed.' })
            }
        } catch (error) {
            setLogs(prev => [...prev, { msg: 'LINK_SEVERED: FATAL_ERROR', type: 'error' }]);
            setResult({ error: 'Neural link severed.' })
        } finally {
            setScanning(false)
        }
    }

    return (
        <div className="grid grid-cols-12 gap-8 h-[600px]">
            {/* Input & Control Panel */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                <div className="glass-surface p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group flex-1 flex flex-col justify-center">
                    <div className="absolute inset-0 neural-grid opacity-10 pointer-events-none" />

                    <div className="flex items-center gap-4 mb-8 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-pro/10 border border-emerald-pro/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            <Zap className="w-6 h-6 text-emerald-pro" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white italic tracking-tighter uppercase">Intercept <span className="text-emerald-pro">Vector</span></h3>
                            <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest leading-none mt-1">Manual Intelligence Probe</div>
                        </div>
                    </div>

                    <form onSubmit={handleScan} className="space-y-6 relative z-10">
                        <div className="relative group/input">
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="ENTER TARGET URL..."
                                className="w-full bg-black/60 border border-white/5 rounded-2xl py-5 px-6 outline-none focus:border-emerald-pro/40 text-xs font-black uppercase tracking-[0.2em] transition-all placeholder:text-gray-800 text-white shadow-inner"
                                required
                            />
                            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-800 group-focus-within/input:text-emerald-pro transition-colors" size={18} />
                        </div>

                        <button
                            type="submit"
                            disabled={scanning}
                            className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] border ${scanning
                                    ? 'bg-white/5 text-gray-700 border-white/5 cursor-not-allowed'
                                    : 'bg-emerald-pro text-obsidian-900 border-emerald-pro hover:bg-white shadow-[0_8px_30px_rgba(16,185,129,0.3)]'
                                }`}
                        >
                            {scanning ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <Shield size={18} />
                            )}
                            {scanning ? 'INTERCEPTING...' : 'TRIGGER ENFORCEMENT'}
                        </button>
                    </form>

                    <div className="mt-8 flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="forensic-text text-[8px] text-gray-700">Wasm Mode</span>
                                <span className="text-[10px] font-black text-emerald-pro">ACTIVE</span>
                            </div>
                            <div className="w-px h-6 bg-white/5" />
                            <div className="flex flex-col">
                                <span className="forensic-text text-[8px] text-gray-700">Secure Pre-flight</span>
                                <span className="text-[10px] font-black text-emerald-pro">ENFORCED</span>
                            </div>
                        </div>
                        <button onClick={() => setUrl('')} className="p-2.5 text-gray-700 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Forensic Terminal & Result Display */}
            <div className="col-span-12 lg:col-span-7 h-full">
                <AnimatePresence mode="wait">
                    {!result && !scanning ? (
                        <motion.div
                            key="placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex flex-col items-center justify-center glass-surface rounded-[2.5rem] border border-white/5 p-10 text-center"
                        >
                            <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6 relative">
                                <div className="absolute inset-0 border border-emerald-pro/20 rounded-full animate-ping opacity-20" />
                                <Terminal className="w-10 h-10 text-gray-700" />
                            </div>
                            <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.4em]">Awaiting Operational Input</h4>
                            <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mt-2">Zero-Trust Neural Intercept Active</p>
                        </motion.div>
                    ) : scanning ? (
                        <motion.div
                            key="terminal"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full bg-[#01040a]/80 backdrop-blur-3xl rounded-[2.5rem] border border-emerald-pro/20 p-8 font-mono flex flex-col shadow-[0_0_50px_rgba(16,185,129,0.05)]"
                        >
                            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-pro shadow-[0_0_10px_#10b981]" />
                                    <span className="text-[10px] font-black text-emerald-pro uppercase tracking-widest">Neural_Forensic_Relay_v4</span>
                                </div>
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-white/5" />
                                    <div className="w-2 h-2 rounded-full bg-white/5" />
                                </div>
                            </div>
                            <div ref={terminalRef} className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                                {logs.map((log, i) => (
                                    <div key={i} className="flex gap-4 text-[10px] leading-relaxed">
                                        <span className="text-gray-700">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                                        <span className={`uppercase font-bold tracking-wider ${log.type === 'success' ? 'text-emerald-pro' :
                                                log.type === 'error' ? 'text-red-500' : 'text-gray-400'
                                            }`}>
                                            {log.type === 'sys' && <span className="text-blue-400">SYS_INT: </span>}
                                            {log.msg}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex gap-4 animate-pulse">
                                    <span className="text-gray-800">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                                    <span className="w-2 h-4 bg-emerald-pro/50" />
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`h-full glass-surface rounded-[2.5rem] p-10 border relative overflow-hidden flex flex-col justify-between ${result.is_phishing ? 'border-red-500/20 bg-red-500/[0.02]' : 'border-emerald-pro/20 bg-emerald-pro/[0.02]'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-6">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${result.is_phishing ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-pro/10 border-emerald-pro/20 text-emerald-pro shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                                        }`}>
                                        {result.is_phishing ? <AlertTriangle size={32} /> : <CheckCircle size={32} />}
                                    </div>
                                    <div>
                                        <div className="forensic-text text-[10px] mb-1">Detection Profile</div>
                                        <h3 className={`text-3xl font-black uppercase tracking-tighter italic ${result.is_phishing ? 'text-red-500' : 'text-white'
                                            }`}>
                                            {result.is_phishing ? 'Threat Detected' : 'Clear Protocol'}
                                        </h3>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="forensic-text text-[10px] mb-1">Risk Index</div>
                                    <div className={`text-4xl font-black font-mono tracking-tighter ${result.is_phishing ? 'text-white' : 'text-emerald-pro'
                                        }`}>
                                        {(result.confidence * 100).toFixed(1)}%
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 py-8 px-8 bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden group/brief">
                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-pro/20 group-hover/brief:bg-emerald-pro/50 transition-colors" />
                                <div className="flex items-center gap-3 mb-4">
                                    <Globe size={14} className="text-gray-700" />
                                    <span className="forensic-text text-[9px]">Neural Intelligence Briefinging</span>
                                </div>
                                <p className="text-[13px] font-black text-gray-400 italic leading-relaxed uppercase tracking-tight">
                                    {typeof result.llm_analysis === 'string' ? result.llm_analysis : result.llm_analysis?.analysis || "NEURAL_SYNC_OPTIMAL"}
                                </p>
                            </div>

                            <div className="mt-8 grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                                    <span className="forensic-text text-[8px]">Threat Class</span>
                                    <span className={`text-[10px] font-black uppercase ${result.is_phishing ? 'text-red-500' : 'text-emerald-pro'}`}>
                                        {result.threat_level || 'NULL'}
                                    </span>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                                    <span className="forensic-text text-[8px]">Neural Confidence</span>
                                    <span className="text-[10px] font-black text-white font-mono">
                                        {(result.confidence * 0.99).toFixed(4)}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default URLScanner
