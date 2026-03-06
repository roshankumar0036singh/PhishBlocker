import { useState, useEffect } from 'react'
import { Clock, AlertTriangle, CheckCircle, ExternalLink, ChevronDown, ChevronUp, ShieldAlert, Cpu, Network, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function RecentScans() {
    const [scans, setScans] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState(null)

    useEffect(() => {
        fetchScans()
        const interval = setInterval(fetchScans, 5000)
        return () => clearInterval(interval)
    }, [])

    const fetchScans = async () => {
        try {
            const response = await fetch(`${API_URL}/api/analytics/recent-scans`)
            if (response.ok) {
                const data = await response.json()
                setScans(data)
            }
        } catch (error) {
            console.error('Error fetching recent scans:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatTime = (timestamp) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diff = Math.floor((now - date) / 1000)

        if (diff < 60) return 'JUST NOW'
        if (diff < 3600) return `${Math.floor(diff / 60)} MIN AGO`
        if (diff < 86400) return `${Math.floor(diff / 3600)} HOURS AGO`
        return date.toLocaleDateString().toUpperCase()
    }

    return (
        <div className="glass-panel rounded-[48px] p-10 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-6">
                    <div className="p-5 bg-accent-emerald/10 rounded-2xl border border-accent-emerald/20 neural-glow">
                        <Clock className="w-7 h-7 text-accent-emerald" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">
                            Intelligence Feed
                        </h2>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1.5 leading-relaxed">Global Neural Telemetry Stream</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 px-5 py-2.5 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse shadow-[0_0_8px_#10b981]" />
                    <span className="text-[9px] font-black text-accent-emerald uppercase tracking-[0.2em]">Synchronized</span>
                </div>
            </div>

            {loading ? (
                <div className="space-y-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 bg-white/[0.02] rounded-[32px] animate-pulse border border-white/5"></div>
                    ))}
                </div>
            ) : (
                <div className="space-y-6 max-h-[650px] overflow-y-auto pr-4 custom-scrollbar">
                    {scans.map((scan) => {
                        const isRed = scan.is_phishing
                        const isExpanded = expandedId === scan.id

                        return (
                            <motion.div
                                key={scan.id}
                                layout
                                className={`group rounded-[32px] border transition-all duration-700 relative overflow-hidden ${isRed
                                    ? 'bg-red-500/[0.03] border-red-500/10 hover:border-red-500/30'
                                    : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                                    }`}
                            >
                                <div className="p-6 relative z-10">
                                    <div className="flex items-center gap-6">
                                        <div
                                            onClick={() => setExpandedId(isExpanded ? null : scan.id)}
                                            className={`w-14 h-14 rounded-2xl cursor-pointer flex items-center justify-center border transition-all duration-700 ${isRed
                                                ? 'bg-red-500/10 border-red-500/20 text-red-500 group-hover:bg-red-500 group-hover:text-white'
                                                : 'bg-white/5 border-white/5 text-accent-emerald group-hover:bg-accent-emerald group-hover:text-night-400'
                                                }`}>
                                            {isRed ? <ShieldAlert size={24} /> : <CheckCircle size={24} />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-[13px] font-black text-white truncate font-mono tracking-tight uppercase group-hover:text-accent-emerald transition-colors">
                                                    {new URL(scan.url).hostname}
                                                </h4>
                                                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest pl-4">
                                                    {formatTime(scan.timestamp)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${isRed ? 'bg-red-500/10 text-red-500' : 'bg-accent-emerald/10 text-accent-emerald'
                                                    }`}>
                                                    {isRed ? 'Neutralized' : 'Sterilized'}
                                                </div>
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                                    Integrity: {(scan.confidence * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : scan.id)}
                                                className="p-3 bg-white/[0.03] rounded-xl text-gray-600 hover:text-white hover:bg-white/10 transition-all"
                                            >
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                            <a
                                                href={scan.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-3 bg-white/[0.03] rounded-xl text-gray-600 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.5, ease: "circOut" }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-8 mt-6 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-6">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                                            <Network size={10} className="text-accent-emerald" /> Node Identity
                                                        </div>
                                                        <div className="text-[11px] font-black text-white font-mono">{scan.forensics.ip}</div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                                            <Globe size={10} className="text-accent-emerald" /> Geolocation
                                                        </div>
                                                        <div className="text-[11px] font-black text-white font-mono">{scan.forensics.location}</div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                                            <Cpu size={10} className="text-accent-emerald" /> Infrastructure
                                                        </div>
                                                        <div className="text-[11px] font-black text-white font-mono">{scan.forensics.server}</div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                                            <ShieldAlert size={10} className="text-accent-emerald" /> Cryptography
                                                        </div>
                                                        <div className="text-[11px] font-black text-white font-mono">{scan.forensics.ssl}</div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
