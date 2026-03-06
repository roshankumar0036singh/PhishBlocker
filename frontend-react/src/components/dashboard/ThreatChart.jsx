import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { TrendingUp, AlertCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const COLORS = {
    low: '#10b981',      // emerald-500
    medium: '#f59e0b',   // amber-500
    high: '#ef4444'      // red-500
}

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
                    { name: 'Minimal', value: result.low, color: COLORS.low },
                    { name: 'Elevated', value: result.medium, color: COLORS.medium },
                    { name: 'Critical', value: result.high, color: COLORS.high }
                ]
                setData(chartData)
            }
        } catch (error) {
            console.error('Error fetching threat distribution:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">
                            Threat Spectrum
                        </h2>
                        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-1">Global Intelligence Mix</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex-grow flex items-center justify-center">
                    <div className="w-12 h-12 border-2 border-purple-500/20 border-t-purple-400 rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    <div className="flex-grow min-h-[220px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            fillOpacity={0.8}
                                            className="hover:fill-opacity-100 transition-all duration-500 outline-none"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(2, 6, 23, 0.95)',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        borderRadius: '16px',
                                        fontSize: '10px',
                                        fontWeight: '900',
                                        textTransform: 'uppercase'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1">Total Hub</span>
                            <span className="text-xl font-black text-white font-mono">
                                {data.reduce((acc, curr) => acc + curr.value, 0)}
                            </span>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-4">
                        {data.map((item) => (
                            <div key={item.name} className="flex flex-col items-center p-3 rounded-2xl bg-white/[0.01] border border-white/5">
                                <span className="text-[11px] font-black font-mono mb-1" style={{ color: item.color }}>
                                    {item.value}
                                </span>
                                <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest text-center">
                                    {item.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
