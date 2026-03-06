import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity, Zap } from 'lucide-react'

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
            console.error('Error fetching activity timeline:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent-emerald/10 rounded-xl border border-accent-emerald/20">
                        <Activity className="w-5 h-5 text-accent-emerald" />
                    </div>
                    <div>
                        <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">
                            Neural Activity
                        </h2>
                        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-1">24-Hour Scan Throughput</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
                    <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Real-time</span>
                </div>
            </div>

            {loading ? (
                <div className="flex-grow flex items-center justify-center">
                    <div className="w-12 h-12 border-2 border-accent-emerald/20 border-t-accent-emerald rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="flex-grow min-h-[250px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="hour"
                                stroke="rgba(255,255,255,0.1)"
                                tick={{ fill: '#4b5563', fontSize: 9, fontWeight: 900 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.1)"
                                tick={{ fill: '#4b5563', fontSize: 9, fontWeight: 900 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(2, 6, 23, 0.95)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    borderRadius: '16px',
                                    fontSize: '10px',
                                    fontWeight: '900',
                                    textTransform: 'uppercase'
                                }}
                                itemStyle={{ color: '#10b981' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="scans"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorScans)"
                                strokeLinecap="round"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}
