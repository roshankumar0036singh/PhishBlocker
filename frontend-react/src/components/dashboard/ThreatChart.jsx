import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { TrendingUp, ShieldAlert, Target, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Elite Pro Spectrum Colors
const COLORS = [
    { name: 'SAFE_LINK', color: '#10b981', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]' },   // emerald
    { name: 'SUSP_VECT', color: '#f59e0b', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]' },   // amber
    { name: 'CRIT_THRT', color: '#ef4444', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]' }     // red
]

export default function ThreatChart() {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 10000)
        return () => clearInterval(interval)
    }, [])

    const fetchData = async () => {
        try {
            const response = await fetch(`${API_URL}/api/analytics/threat-distribution`)
            if (response.ok) {
                const result = await response.json()
                const chartData = [
                    { name: 'SAFE_LINK', value: result.low || 0, color: COLORS[0].color },
                    { name: 'SUSP_VECT', value: result.medium || 0, color: COLORS[1].color },
                    { name: 'CRIT_THRT', value: result.high || 0, color: COLORS[2].color }
                ]
                setData(chartData)
            }
        } catch (error) {
            console.error('Threat distribution fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    const totalIntercepts = data.reduce((acc, curr) => acc + curr.value, 0)

    return (
        <div className="glass-surface p-8 rounded-[2.5rem] border border-white/5 h-full flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 neural-grid opacity-[0.03] pointer-events-none" />

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-pro/10 border border-blue-pro/20 flex items-center justify-center">
                        <Target size={18} className="text-blue-pro shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.25em] italic">Threat <span className="text-blue-pro">Spectrum</span></h3>
                        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest leading-none mt-1">Intelligence Mix Distribution</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-[220px] relative mt-4">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-white/5 border-t-blue-pro rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={75}
                                    outerRadius={95}
                                    paddingAngle={10}
                                    dataKey="value"
                                    stroke="none"
                                    animationDuration={1500}
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            fillOpacity={0.4}
                                            className="hover:fill-opacity-80 transition-all duration-500 cursor-crosshair outline-none"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(1, 4, 10, 0.95)',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        borderRadius: '16px',
                                        fontSize: '10px',
                                        fontWeight: '900',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                                        backdropFilter: 'blur(20px)'
                                    }}
                                    itemStyle={{ color: '#fff', textTransform: 'uppercase' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-2">
                            <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.4em] mb-1">INTERCEPTS</span>
                            <span className="text-3xl font-black text-white font-mono tracking-tighter italic">
                                {totalIntercepts}
                            </span>
                        </div>
                    </>
                )}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 relative z-10">
                {data.map((item, i) => (
                    <div key={i} className="flex flex-col items-center p-3 rounded-2xl bg-white/[0.02] border border-white/5 group/t-item">
                        <span className="text-sm font-black font-mono mb-1" style={{ color: item.color }}>
                            {item.value}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: item.color }} />
                            <span className="text-[7px] font-black text-gray-700 uppercase tracking-widest">{item.name.split('_')[0]}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between opacity-50 relative z-10">
                <div className="flex items-center gap-2">
                    <ShieldAlert size={12} className="text-gray-700" />
                    <span className="forensic-text text-[8px] text-gray-700 uppercase">Perimeter Integrity: 100%</span>
                </div>
                <Zap size={12} className="text-emerald-pro" />
            </div>
        </div>
    )
}
