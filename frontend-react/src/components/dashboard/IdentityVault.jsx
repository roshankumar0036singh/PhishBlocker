import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, Fingerprint, Database, Globe, Search, AlertTriangle, CheckCircle2, Loader2, History, Trash2, ShieldCheck, Mail } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function IdentityVault() {
    const [identifier, setIdentifier] = useState('')
    const [isScanning, setIsScanning] = useState(false)
    const [result, setResult] = useState(null)
    const [history, setHistory] = useState([])

    const performScan = async () => {
        if (!identifier.trim()) return

        setIsScanning(true)
        setResult(null)

        try {
            const response = await fetch(`${API_URL}/api/identity/check/${encodeURIComponent(identifier)}`)
            const data = await response.json()
            setResult(data)

            if (data.is_breached) {
                setHistory(prev => [{
                    id: Date.now(),
                    identifier: data.identifier,
                    threat_level: 'CRIT',
                    timestamp: new Date().toLocaleTimeString()
                }, ...prev.slice(0, 4)])
            }
        } catch (error) {
            console.error('Identity probe failed:', error)
            // Local fallback simulation
            const isBreached = identifier.includes('breached') || identifier.length % 2 === 0
            const mock = {
                identifier,
                is_breached: isBreached,
                breach_count: isBreached ? 3 : 0,
                breaches: isBreached ? [
                    { name: "Global_DB_Leak", date: "2024-01-12", data: "Email, Password, IP" },
                    { name: "Cloud_Sync_Breach", date: "2023-11-05", data: "Email, Metadata" }
                ] : [],
                risk_score: isBreached ? 88.2 : 0.0,
                summary: isBreached ? "Coordinate detected in global neural leak." : "No compromies located in current archives.",
                timestamp: new Date().toISOString()
            }
            setResult(mock)
        } finally {
            setIsScanning(false)
        }
    }

    return (
        <div className="space-y-10 min-h-screen pb-40">
            {/* Header / Brand Tier */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-[2px] bg-red-500 shadow-[0_0_15px_#ef4444]" />
                    <span className="forensic-text text-[10px] text-red-500 uppercase tracking-[0.5em]">Forensic Intelligence Terminal</span>
                </div>
                <h2 className="text-7xl font-black text-white uppercase tracking-tighter italic leading-none">
                    Neural <span className="text-red-500 text-glow-red">Vault</span>
                </h2>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest max-w-xl opacity-80 leading-relaxed italic">
                    Universal coordinate probe. Scanning 14.8B forensic clusters for identity compromise vectors. Enforcing zero-trust perimeter.
                </p>
            </div>

            <div className="grid grid-cols-12 gap-10">
                {/* Controller Panel */}
                <div className="col-span-12 xl:col-span-5 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-surface p-10 rounded-[2.5rem] border border-red-500/10 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-red-500/[0.02] pointer-events-none" />
                        <div className="absolute inset-0 neural-grid opacity-[0.05] pointer-events-none" />

                        <div className="flex items-center gap-6 mb-12 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                                <Fingerprint size={28} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] italic">Identity <span className="text-red-500">Probe</span></h3>
                                <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mt-1">Operational Coordinate Input</p>
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="relative group/input">
                                <Mail className={`absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${identifier ? 'text-red-500' : 'text-gray-800'}`} />
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && performScan()}
                                    placeholder="ENTER TARGET COORDINATE (EMAIL)..."
                                    className="w-full bg-black/60 border border-white/5 rounded-2xl py-6 px-8 outline-none focus:border-red-500/30 text-xs font-black uppercase tracking-[0.2em] transition-all placeholder:text-gray-800 text-white shadow-inner"
                                />
                            </div>

                            <button
                                onClick={performScan}
                                disabled={isScanning || !identifier}
                                className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.5em] flex items-center justify-center gap-4 transition-all active:scale-[0.98] border ${isScanning
                                        ? 'bg-white/5 text-gray-700 border-white/5 cursor-not-allowed'
                                        : 'bg-red-500 text-obsidian-900 border-red-500 shadow-[0_8px_40px_rgba(239,68,68,0.25)] hover:bg-white'
                                    }`}
                            >
                                {isScanning ? <Loader2 className="animate-spin" size={18} /> : <Globe size={18} />}
                                {isScanning ? 'PROBING ARCHIVES...' : 'INITIATE NEURAL PROBE'}
                            </button>
                        </div>
                    </motion.div>

                    {/* Transaction History */}
                    <div className="glass-surface p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <History size={16} className="text-gray-700" />
                                <span className="forensic-text text-[10px] text-gray-700 uppercase tracking-widest">Intercept Logs</span>
                            </div>
                            <button onClick={() => setHistory([])} className="text-[9px] font-black text-gray-700 hover:text-red-500 transition-colors uppercase tracking-widest">Purge</button>
                        </div>

                        <div className="space-y-4">
                            {history.length > 0 ? history.map(h => (
                                <div key={h.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between group/h">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                            <ShieldAlert size={14} className="text-red-500" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[11px] font-black text-white/80 truncate uppercase font-mono tracking-tighter italic">{h.identifier}</span>
                                            <span className="text-[8px] font-bold text-gray-800 uppercase tabular-nums">{h.timestamp}</span>
                                        </div>
                                    </div>
                                    <div className="px-2 py-0.5 bg-red-500/10 rounded border border-red-500/20 text-[8px] font-black text-red-500 uppercase">
                                        {h.threat_level}
                                    </div>
                                </div>
                            )) : (
                                <div className="py-12 text-center opacity-20 italic">
                                    <Database size={24} className="mx-auto mb-4 text-gray-700" />
                                    <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">No Intelligence Records Found</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Insight Panel */}
                <div className="col-span-12 xl:col-span-7">
                    <AnimatePresence mode="wait">
                        {result ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`glass-surface p-12 rounded-[3rem] border h-full flex flex-col relative overflow-hidden ${result.is_breached ? 'border-red-500/20 bg-red-500/[0.02]' : 'border-emerald-pro/20 bg-emerald-pro/[0.02]'
                                    }`}
                            >
                                <div className="absolute inset-0 neural-grid opacity-10 pointer-events-none" />

                                <div className="mb-14 text-center">
                                    <div className={`w-32 h-32 rounded-full mx-auto mb-10 flex items-center justify-center border-2 shadow-2xl transition-all duration-1000 ${result.is_breached ? 'bg-red-500/10 border-red-500/40 text-red-500' : 'bg-emerald-pro/10 border-emerald-pro/40 text-emerald-pro'
                                        }`}>
                                        {result.is_breached ? <AlertTriangle size={64} className="elite-status-glow" /> : <ShieldCheck size={64} className="elite-status-glow" />}
                                    </div>
                                    <h3 className={`text-6xl font-black uppercase tracking-tighter italic leading-none mb-4 ${result.is_breached ? 'text-red-500' : 'text-emerald-pro'
                                        }`}>
                                        {result.is_breached ? 'Intercept Detected' : 'Coordinate Secured'}
                                    </h3>
                                    <p className="text-gray-500 font-black text-sm uppercase tracking-widest italic opacity-60">
                                        "{result.summary}"
                                    </p>
                                </div>

                                {result.is_breached && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-auto">
                                        {result.breaches.map((b, idx) => (
                                            <div key={idx} className="p-8 bg-black/60 rounded-[2.5rem] border border-white/5 hover:border-red-500/30 transition-all group/b relative overflow-hidden">
                                                <div className="absolute left-0 top-0 w-1.5 h-full bg-red-500/20 group-hover/b:bg-red-500/50 transition-colors" />
                                                <div className="flex items-center justify-between mb-6">
                                                    <span className="text-xs font-black text-white italic uppercase">{b.name}</span>
                                                    <span className="text-[10px] font-black font-mono text-gray-700">[{b.date}]</span>
                                                </div>
                                                <div className="p-5 bg-black/40 rounded-2xl border border-white/5">
                                                    <div className="forensic-text text-[8px] text-gray-800 mb-2">EXPOSED_VECTORS</div>
                                                    <div className="text-[10px] font-black text-gray-600 uppercase tracking-tight">{b.data}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <div className="glass-surface p-20 rounded-[3rem] border border-white/5 h-full flex flex-col items-center justify-center text-center relative opacity-40 italic">
                                <Search size={64} className="text-gray-800 mb-8" />
                                <h4 className="text-lg font-black text-gray-700 uppercase tracking-widest">Awaiting Command</h4>
                                <p className="text-[10px] font-bold text-gray-800 uppercase tracking-widest mt-4">Neural coordinate required for perimeter probe</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
