import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { Activity, Shield, Target } from 'lucide-react'

const data = [
    { subject: 'LEXICAL', A: 96, fullMark: 100 },
    { subject: 'SSL/TLS', A: 82, fullMark: 100 },
    { subject: 'ENTROPY', A: 91, fullMark: 100 },
    { subject: 'HOMOGRAPH', A: 98, fullMark: 100 },
    { subject: 'META-TAG', A: 88, fullMark: 100 },
    { subject: 'CONTEXT', A: 94, fullMark: 100 },
]

export default function ModelPerformanceRadar() {
    return (
        <div className="glass-surface p-10 rounded-[2.5rem] border border-white/5 h-full flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 neural-grid opacity-[0.03] pointer-events-none" />

            <div className="flex items-center justify-between mb-10 relative z-10 px-2">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-obsidian-800 border border-white/5 flex items-center justify-center">
                        <Activity size={18} className="text-gray-600" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.25em] italic">Stability <span className="text-emerald-pro">Matrix</span></h3>
                        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest leading-none mt-1">Multi-Vector Fidelity Analysis</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-emerald-pro/10 border border-emerald-pro/20 rounded-lg">
                    <span className="text-[8px] font-black text-emerald-pro uppercase tracking-widest">CALIBRATED</span>
                </div>
            </div>

            <div className="flex-1 min-h-[300px] relative mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                        <PolarGrid stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: '#374151', fontSize: 9, fontWeight: 900, letterSpacing: '0.15em' }}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={false}
                            axisLine={false}
                        />
                        <Radar
                            name="Fidelity"
                            dataKey="A"
                            stroke="#10b981"
                            strokeWidth={3}
                            fill="#10b981"
                            fillOpacity={0.15}
                            dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#01040a' }}
                            animationDuration={2000}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 group/s">
                    <span className="forensic-text text-[8px] text-gray-800 uppercase block mb-1">Mean Delta</span>
                    <div className="text-xl font-black text-white font-mono tracking-tighter italic">93.2%</div>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 group/s">
                    <span className="forensic-text text-[8px] text-gray-800 uppercase block mb-1">Latency</span>
                    <div className="text-xl font-black text-white font-mono tracking-tighter italic">18ms</div>
                </div>
            </div>
        </div>
    )
}
