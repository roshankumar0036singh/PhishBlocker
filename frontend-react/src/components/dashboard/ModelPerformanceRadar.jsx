import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const data = [
    { subject: 'Lexical', A: 95, fullMark: 100 },
    { subject: 'SSL/TLS', A: 88, fullMark: 100 },
    { subject: 'Entropy', A: 92, fullMark: 100 },
    { subject: 'Homograph', A: 98, fullMark: 100 },
    { subject: 'Meta-Tag', A: 85, fullMark: 100 },
    { subject: 'Behavioral', A: 90, fullMark: 100 },
];

export default function ModelPerformanceRadar() {
    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div className="text-[10px] font-black text-accent-emerald uppercase tracking-[0.3em]">Neural Spectrum Analysis</div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald shadow-[0_0_8px_#10b981]" />
                    <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Calibrated</span>
                </div>
            </div>

            <div className="flex-1 min-h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                        <PolarGrid stroke="rgba(255,255,255,0.03)" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: '#4b5563', fontSize: 9, fontWeight: 900 }}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={false}
                            axisLine={false}
                        />
                        <Radar
                            name="Confidence"
                            dataKey="A"
                            stroke="#10b981"
                            strokeWidth={3}
                            fill="#10b981"
                            fillOpacity={0.1}
                            dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#020617' }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-6">
                <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col items-center">
                    <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Mean Fidelity</div>
                    <div className="text-xl font-black text-white font-mono">91.4%</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col items-center">
                    <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Inference Lag</div>
                    <div className="text-xl font-black text-white font-mono">42ms</div>
                </div>
            </div>
        </div>
    );
}
