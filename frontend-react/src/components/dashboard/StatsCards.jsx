import { useState, useEffect } from 'react'
import { Activity, Shield, TrendingUp, Radio, Zap, Globe, Cpu } from 'lucide-react'
import { motion } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function StatsCards() {
    const [stats, setStats] = useState({
        total_scans: 0,
        threats_blocked: 0,
        active_nodes: 12,
        detection_fidelity: 99.4
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 5000)
        return () => clearInterval(interval)
    }, [])

    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_URL}/api/analytics/global/stats`)
            if (response.ok) {
                const data = await response.json()
                setStats(prev => ({ ...prev, ...data }))
            }
        } catch (error) {
            console.error('Stats fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    const cardData = [
        { label: 'Neural Traffic', value: stats.total_scans, icon: Globe, color: 'text-emerald-pro', trend: '+12.4%', desc: 'Global intercepts' },
        { label: 'Neutralized', value: stats.threats_blocked, icon: Shield, color: 'text-red-500', trend: '+3.1%', desc: 'Malicious vectors' },
        { label: 'Fidelity Index', value: `${stats.detection_fidelity}%`, icon: Cpu, color: 'text-blue-pro', trend: 'Optimized', desc: 'Neural confidence' },
        { label: 'Active Nodes', value: stats.active_nodes, icon: Radio, color: 'text-emerald-pro', trend: 'STABLE', desc: 'Sync relay nodes' },
    ]

    return (
        <div className="space-y-6 flex-1">
            {cardData.map((stat, i) => {
                const Icon = stat.icon
                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 glass-surface rounded-[2rem] border border-white/5 relative group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/[0.01] group-hover:bg-white/[0.03] transition-colors" />

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className={`p-2.5 rounded-xl bg-black/40 border border-white/5 ${stat.color}`}>
                                <Icon size={18} className="elite-status-glow" />
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="forensic-text text-[8px] text-gray-700">Telemetry</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${stat.color === 'text-red-500' ? 'text-red-500/80' : 'text-emerald-pro/80'}`}>
                                    {stat.trend}
                                </span>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <div className="text-3xl font-black text-white font-mono tracking-tighter mb-1">
                                {loading ? '---' : typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em]">{stat.label}</span>
                                <span className="text-[9px] font-bold text-gray-700 uppercase tracking-widest italic">{stat.desc}</span>
                            </div>
                        </div>

                        {/* Micro Sparkline Placeholder */}
                        <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.random() * 40 + 60}%` }}
                                className={`h-full ${stat.color === 'text-red-500' ? 'bg-red-500' : 'bg-emerald-pro'} opacity-30`}
                            />
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}
