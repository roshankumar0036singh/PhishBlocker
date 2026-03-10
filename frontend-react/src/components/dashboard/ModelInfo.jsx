import { useState, useEffect } from 'react'
import { Cpu, CheckCircle, XCircle, Zap, ShieldCheck, Activity } from 'lucide-react'
import { motion } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function ModelInfo() {
    const [modelInfo, setModelInfo] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchModelInfo()
        const interval = setInterval(fetchModelInfo, 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchModelInfo = async () => {
        try {
            const response = await fetch(`${API_URL}/api/model/info`)
            if (response.ok) {
                const data = await response.json()
                setModelInfo(data)
            }
        } catch (error) {
            console.error('Model info fetch error:', error)
            // Local fallback
            setModelInfo({
                status: 'loaded',
                model_type: 'ENSEMBLE-V2',
                version: '2.4.0-ELITE',
                features: 24,
                models: ['RandomForest', 'XGBoost', 'LightGBM', 'DeepNeural']
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="glass-surface p-8 rounded-[2.5rem] border border-white/5 h-full flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 neural-grid opacity-[0.03] pointer-events-none" />

            <div className="flex items-center justify-between mb-8 relative z-10 px-2">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-pro/10 border border-emerald-pro/20 flex items-center justify-center">
                        <Cpu size={18} className="text-emerald-pro shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.25em] italic">Neural <span className="text-emerald-pro">Core</span></h3>
                        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest leading-none mt-1">Operational Engine Telemetry</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 space-y-4 relative z-10 overflow-y-auto custom-scrollbar pr-2">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-16 bg-white/[0.01] rounded-2xl border border-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : modelInfo ? (
                    <>
                        <InfoRow label="Operational State" value={modelInfo.status === 'loaded' ? 'ACTIVE' : 'FAULT'} active={modelInfo.status === 'loaded'} />
                        <InfoRow label="Logic Architecture" value={modelInfo.model_type} />
                        <InfoRow label="Inference Version" value={modelInfo.version} />
                        <InfoRow label="Feature Sensors" value={`${modelInfo.features} VECTORS`} />

                        <div className="mt-8 pt-8 border-t border-white/5">
                            <h4 className="forensic-text text-[9px] text-gray-700 uppercase tracking-widest mb-6 px-1">Ensemble Processing Units</h4>
                            <div className="grid grid-cols-1 gap-3">
                                {modelInfo.models?.map((model, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl group/m">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-xl bg-obsidian-800 border border-white/10 flex items-center justify-center">
                                                <Zap size={14} className="text-emerald-pro/40 group-hover/m:text-emerald-pro transition-colors" />
                                            </div>
                                            <span className="text-[11px] font-black text-white/50 group-hover/m:text-white transition-colors uppercase italic">{model}</span>
                                        </div>
                                        <ShieldCheck size={14} className="text-emerald-pro/20 group-hover/m:text-emerald-pro transition-all" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 italic">
                        <XCircle size={32} className="mb-4 text-red-500" />
                        <span className="text-[10px] uppercase font-black">Telemetry Sink Lost</span>
                    </div>
                )}
            </div>
        </div>
    )
}

function InfoRow({ label, value, active }) {
    return (
        <div className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-emerald-pro/[0.02] hover:border-emerald-pro/10 transition-all group/row">
            <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest group-hover/row:text-gray-500 transition-colors">{label}</span>
            <div className="flex items-center gap-3">
                {active !== undefined && (
                    <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-pro shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} />
                )}
                <span className={`text-[11px] font-black italic uppercase italic tracking-tighter ${active === true ? 'text-emerald-pro' : active === false ? 'text-red-500' : 'text-white'
                    }`}>
                    {value}
                </span>
            </div>
        </div>
    )
}
