import { useState, useEffect } from 'react'
import { Clock, AlertTriangle, CheckCircle, ExternalLink, ChevronDown, ChevronUp, ShieldAlert, Cpu, Network, Globe, Activity } from 'lucide-react'
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
            console.error('Recent scans fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatTime = (timestamp) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diff = Math.floor((now - date) / 1000)
        if (diff < 60) return 'JUST NOW'
        if (diff < 3600) return `${Math.floor(diff / 60)}M AGO`
        if (diff < 86400) return `${Math.floor(diff / 3600)}H AGO`
        return date.toLocaleDateString().toUpperCase()
    }

    return (
        <div className="glass-surface p-8 rounded-[2.5rem] border border-white/5 h-full flex flex-col relative overflow-hidden group/scans">
            <div className="absolute inset-0 neural-grid opacity-[0.03] pointer-events-none" />

            <div className="flex items-center justify-between mb-10 relative z-10 px-2">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-obsidian-800 border border-white/5 flex items-center justify-center">
                        <Activity size={18} className="text-gray-600" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.25em] italic">Forensic <span className="text-emerald-pro">Archive</span></h3>
                        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest leading-none mt-1">Intercept Transaction Logs</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-gray-800 uppercase">Archive nodes</span>
                        <span className="text-[10px] font-black text-white uppercase tracking-tighter">Synchronized</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 pb-4 relative z-10">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-20 bg-white/[0.01] rounded-2xl border border-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : scans.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 italic py-20">
                        <span className="text-xs uppercase tracking-widest text-gray-500">No telemetry data found</span>
                    </div>
                ) : (
                    scans.map((scan) => {
                        const isRed = scan.is_phishing
                        const isExpanded = expandedId === scan.id
                        return (
                            <motion.div
                                key={scan.id}
                                layout
                                className={`rounded-2xl border border-white/5 transition-all duration-500 overflow-hidden ${isRed ? 'bg-red-500/[0.03] border-red-500/10' : 'bg-white/[0.01]'
                                    } hover:border-white/10`}
                            >
                                <div className="p-5 flex items-center gap-5">
                                    <div
                                        onClick={() => setExpandedId(isExpanded ? null : scan.id)}
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${isRed ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-white/[0.02] border-white/5 text-emerald-pro/50'
                                            }`}
                                    >
                                        {isRed ? <ShieldAlert size={20} /> : <CheckCircle size={20} />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <h4 className="text-xs font-black text-white truncate uppercase tracking-tight">
                                                {new URL(scan.url).hostname}
                                            </h4>
                                            <span className="text-[9px] font-black text-gray-700 tabular-nums">
                                                {formatTime(scan.timestamp)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${isRed ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-pro/10 border-emerald-pro/20 text-emerald-pro'
                                                }`}>
                                                {isRed ? 'Intercept' : 'Clearance'}
                                            </div>
                                            <div className="w-1 h-1 rounded-full bg-white/5" />
                                            <span className="text-[10px] font-mono text-gray-700 font-bold">
                                                ID: {scan.id.slice(0, 8)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : scan.id)}
                                            className="p-2 rounded-lg bg-black/40 border border-white/5 text-gray-700 hover:text-white transition-colors"
                                        >
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                        <a
                                            href={scan.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2 rounded-lg bg-emerald-pro/10 border border-emerald-pro/20 text-emerald-pro hover:bg-emerald-pro hover:text-obsidian-900 transition-all opacity-0 group-hover/scans:opacity-100"
                                        >
                                            <ExternalLink size={14} />
                                        </a>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-white/5 bg-black/40 p-5 grid grid-cols-2 lg:grid-cols-4 gap-4"
                                        >
                                            <ForensicMetric icon={Network} label="SOURCE NODE" value={scan.forensics?.ip || "NULL"} />
                                            <ForensicMetric icon={Globe} label="GEOLOCATION" value={scan.forensics?.location || "UNKNOWN"} />
                                            <ForensicMetric icon={Cpu} label="PROVIDER" value={scan.forensics?.server || "GENERIC"} />
                                            <ForensicMetric icon={ShieldAlert} label="ML_LABEL" value={scan.threat_level || "SAFE"} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

function ForensicMetric({ icon: Icon, label, value }) {
    return (
        <div className="space-y-1.5 group/m">
            <div className="flex items-center gap-2 text-[8px] font-black text-gray-800 uppercase tracking-widest group-hover/m:text-gray-600 transition-colors">
                <Icon size={10} className="text-emerald-pro/30" />
                {label}
            </div>
            <div className="text-[10px] font-black text-white/70 font-mono truncate">{value}</div>
        </div>
    )
}
