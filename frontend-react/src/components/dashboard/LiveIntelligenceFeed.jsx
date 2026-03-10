import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Zap, Target, Globe, Server, Activity, Cpu, AlertOctagon } from 'lucide-react'

export default function LiveIntelligenceFeed() {
    const [events, setEvents] = useState([])
    const [stats, setStats] = useState({ throughput: '2.44 GB/S', status: 'NOMINAL' })

    const fetchLiveThreats = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/threats/community')
            const data = await response.json()

            // Transform API threats into dashboard events
            const mappedEvents = (data.threats || []).map((t, i) => ({
                id: i,
                type: t.threat_type?.toUpperCase() || 'PHISH',
                detail: `Neutralized threat at ${t.url?.substring(0, 20)}...`,
                origin: t.severity === 'critical' ? 'CORE-SYNC' : 'EDGE-NODE',
                time: t.timestamp ? new Date(t.timestamp).toLocaleTimeString([], { hour12: false }) : 'LIVE',
                icon: t.severity === 'critical' ? AlertOctagon : Shield,
                color: t.severity === 'critical' ? 'text-red-500' : 'text-emerald-pro'
            }))

            setEvents(mappedEvents.slice(0, 5))
        } catch (error) {
            console.error('Failed to sync live intelligence:', error)
        }
    }

    useEffect(() => {
        fetchLiveThreats()
        const interval = setInterval(fetchLiveThreats, 10000) // Update every 10s
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="glass-surface p-8 rounded-[2.5rem] border border-white/5 h-full flex flex-col relative overflow-hidden group/feed">
            <div className="absolute inset-0 neural-grid opacity-[0.03] pointer-events-none" />

            <div className="flex items-center justify-between mb-8 relative z-10 px-2">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-pro animate-ping absolute inset-0 opacity-20" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-pro shadow-[0_0_12px_#10b981] relative z-10" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.25em] italic">Neural <span className="text-emerald-pro">Relay</span></h3>
                        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest leading-none mt-1">Live Intelligence Flux</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.02] border border-white/5 rounded-lg">
                    <Cpu size={12} className="text-gray-800" />
                    <span className="text-[9px] font-black text-white/50 font-mono tracking-tighter">ELITE_CORE_v2</span>
                </div>
            </div>

            <div className="flex-1 space-y-3 overflow-hidden relative z-10">
                {events.map((event, index) => (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08, duration: 0.4 }}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/10 hover:bg-emerald-pro/[0.02] hover:border-emerald-pro/20 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-emerald-pro opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className={`p-2.5 rounded-xl bg-black/40 border border-white/5 ${event.color}`}>
                            <event.icon size={14} className="elite-status-glow" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-[9px] font-black uppercase tracking-widest ${event.color}`}>{event.type}</span>
                                <span className="text-[8px] font-bold text-gray-800 font-mono">[ {event.time} ]</span>
                            </div>
                            <p className="text-[11px] font-black text-white/60 truncate italic uppercase tracking-tight">
                                {event.detail}
                            </p>
                        </div>

                        <div className="hidden lg:flex flex-col items-end gap-1 border-l border-white/5 pl-4">
                            <span className="text-[8px] font-black text-gray-800 uppercase tabular-nums">{event.origin}</span>
                            <div className="flex gap-0.5">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={`w-0.5 h-0.5 rounded-full ${i === (index % 3) + 1 ? 'bg-emerald-pro' : 'bg-gray-900'}`} />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between px-2 relative z-10">
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-gray-800 uppercase tracking-widest">THROUGHPUT</span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white/90 font-mono tracking-tighter italic">2.44 GB/S</span>
                        <div className="px-1.5 py-0.5 rounded bg-emerald-pro/10 border border-emerald-pro/20 text-[7px] font-black text-emerald-pro uppercase">NOMINAL</div>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-obsidian-800 border border-white/5 px-4 py-2.5 rounded-2xl group hover:border-emerald-pro/20 transition-all cursor-crosshair">
                    <Activity size={14} className="text-emerald-pro animate-pulse" />
                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest group-hover:text-emerald-pro transition-colors">Neural Sync Active</span>
                </div>
            </div>
        </div>
    )
}
