import { useState, useEffect } from 'react'
import { Activity, Shield, TrendingUp, Users, Radio, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function StatsCards() {
    const [stats, setStats] = useState({
        total_scans: 0,
        threats_blocked: 0,
        active_users: 0,
        detection_rate: 0
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
                setStats(data)
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const cards = [
        {
            title: 'Global Telemetry',
            value: stats.total_scans,
            icon: Radio,
            glow: 'rgba(16, 185, 129, 0.1)',
            label: 'Total Logic Units Synchronized'
        },
        {
            title: 'Threat Neutralization',
            value: stats.threats_blocked,
            icon: Zap,
            glow: 'rgba(239, 68, 68, 0.1)',
            label: 'Malicious Vectors Blocked',
            isRed: true
        },
        {
            title: 'Neural Fidelity',
            value: `${stats.detection_rate}%`,
            icon: Shield,
            glow: 'rgba(16, 185, 129, 0.1)',
            label: 'Algorithm Integrity Score'
        },
        {
            title: 'Host Pulsing',
            value: stats.active_users,
            icon: Activity,
            glow: 'rgba(16, 185, 129, 0.1)',
            label: 'Active Neural Nodes'
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {cards.map((card, index) => (
                <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className="glass-panel p-9 rounded-[48px] relative overflow-hidden group hover:scale-[1.03] transition-all duration-700"
                >
                    {/* Background Glow */}
                    <div
                        className="absolute -right-8 -bottom-8 w-40 h-40 blur-[80px] rounded-full transition-all duration-1000 opacity-20 group-hover:opacity-40"
                        style={{ background: card.isRed ? '#ef444433' : '#10b98133' }}
                    />

                    <div className="flex justify-between items-start mb-12 relative z-10">
                        <div className={`p-5 rounded-2xl bg-white/[0.03] border border-white/5 transition-all duration-700 group-hover:border-white/10 ${card.isRed ? 'text-red-500' : 'text-accent-emerald'}`}>
                            <card.icon size={28} className={card.isRed ? 'animate-pulse' : ''} />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Live</span>
                            <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px] ${card.isRed ? 'bg-red-500 shadow-red-500' : 'bg-accent-emerald shadow-accent-emerald'}`} />
                        </div>
                    </div>

                    <div className="relative z-10">
                        <div className="text-5xl font-black mb-3 font-mono tracking-tighter text-white group-hover:text-accent-emerald transition-colors duration-700">
                            {loading ? '---' : (typeof card.value === 'number' ? card.value.toLocaleString() : card.value)}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[11px] uppercase tracking-[0.4em] font-black text-white/80">{card.title}</span>
                            <span className="text-[9px] uppercase tracking-[0.1em] font-bold text-gray-600 leading-none">{card.label}</span>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
