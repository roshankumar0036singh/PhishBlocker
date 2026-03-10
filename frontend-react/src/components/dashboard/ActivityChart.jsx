import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity, Radio } from 'lucide-react'
import { motion } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function ActivityChart() {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 10000)
        return () => clearInterval(interval)
    }, [])

    const fetchData = async () => {
        try {
            const response = await fetch(`${API_URL}/api/analytics/activity-timeline`)
            if (response.ok) {
                const result = await response.json()
                setData(result.timeline)
            }
        } catch (error) {
            console.error('Activity timeline fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="glass-surface p-8 rounded-[2.5rem] border border-white/5 h-full flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 neural-grid opacity-[0.03] pointer-events-none" />

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-pro/10 border border-emerald-pro/20 flex items-center justify-center">
                        <Activity size={18} className="text-emerald-pro elite-status-glow" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.25em] italic">Neural <span className="text-emerald-pro">Throughput</span></h3>
                        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest leading-none mt-1">24H Operations Matrix</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-pro animate-pulse shadow-[0_0_8px_#10b981]" />
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Live Flux</span>
                </div>
            </div>

            <div className="flex-1 min-h-[220px] relative mt-4">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-white/5 border-t-emerald-pro rounded-full animate-spin" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="fluxGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                            <XAxis
                                dataKey="hour"
                                stroke="rgba(255,255,255,0.05)"
                                tick={{ fill: '#374151', fontSize: 10, fontWeight: 900 }}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.05)"
                                tick={{ fill: '#374151', fontSize: 10, fontWeight: 900 }}
                                axisLine={false}
                                tickLine={false}
                                dx={-5}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(1, 4, 10, 0.95)',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    borderRadius: '16px',
                                    fontSize: '10px',
                                    fontWeight: '900',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                                    backdropFilter: 'blur(20px)'
                                }}
                                itemStyle={{ color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                cursor={{ stroke: 'rgba(16, 185, 129, 0.1)', strokeWidth: 2 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="scans"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#fluxGradient)"
                                strokeLinecap="round"
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                <div className="flex gap-4">
                    <div className="flex flex-col">
                        <span className="forensic-text text-[8px] text-gray-700">Peak Load</span>
                        <span className="text-xs font-black text-white">4.2k <span className="text-[10px] text-gray-800">MPS</span></span>
                    </div>
                    <div className="w-px h-6 bg-white/5" />
                    <div className="flex flex-col">
                        <span className="forensic-text text-[8px] text-gray-700">Flux Rate</span>
                        <span className="text-xs font-black text-emerald-pro italic">+12%</span>
                    </div>
                </div>
                <Radio size={14} className="text-gray-800 animate-pulse" />
            </div>
        </div>
    )
}
