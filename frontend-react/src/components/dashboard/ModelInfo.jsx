import { useState, useEffect } from 'react'
import { Cpu, CheckCircle, XCircle, Zap, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
            console.error('Error fetching model info:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-accent-emerald/10 rounded-2xl border border-accent-emerald/20 transition-all duration-700 hover:border-accent-emerald/40 group">
                    <Cpu className="w-6 h-6 text-accent-emerald group-hover:scale-110 transition-transform" />
                </div>
                <div>
                    <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">
                        Neural Core
                    </h2>
                    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-1">Inference Engine State</p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-16 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : modelInfo ? (
                <div className="space-y-4">
                    <InfoRow label="Operational State" value={modelInfo.status === 'loaded' ? 'NOMINAL' : 'FAULT'} active={modelInfo.status === 'loaded'} />
                    <InfoRow label="Core Logic" value={modelInfo.model_type || 'TRANSFORMER-XL'} />
                    <InfoRow label="Synaptic Build" value={modelInfo.version || '2026.4.1'} />
                    <InfoRow label="Feature Volume" value={modelInfo.features || '1,240'} />

                    {modelInfo.models && (
                        <div className="mt-10 pt-8 border-t border-white/5">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[9px] font-black text-gray-700 uppercase tracking-[0.2em]">
                                    Active Ensemble Nodes
                                </h3>
                                <div className="px-2 py-0.5 rounded-md bg-white/[0.02] border border-white/5 text-[8px] font-black text-gray-700 uppercase">
                                    {modelInfo.models.length} Units
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {modelInfo.models.map((model, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/5 rounded-2xl group hover:border-accent-emerald/20 hover:bg-white/[0.02] transition-all duration-500"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-white/[0.03] rounded-lg border border-white/5">
                                                <Zap size={10} className="text-accent-emerald" />
                                            </div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">
                                                {model}
                                            </span>
                                        </div>
                                        <ShieldCheck size={12} className="text-accent-emerald/20 group-hover:text-accent-emerald transition-colors" />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-grow flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-red-500/5 rounded-full flex items-center justify-center mb-4 border border-red-500/10">
                        <XCircle className="w-8 h-8 text-red-500/30" />
                    </div>
                    <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Telemetry Lost</p>
                </div>
            )}
        </div>
    )
}

const InfoRow = ({ label, value, active }) => (
    <div className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.03] hover:border-white/10 transition-all duration-500 group">
        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest group-hover:text-gray-400 transition-colors">
            {label}
        </span>
        <div className="flex items-center gap-3">
            {active !== undefined && (
                <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-accent-emerald animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></div>
            )}
            <span className={`text-[10px] font-black font-mono tracking-tighter ${active === true ? 'text-accent-emerald' : active === false ? 'text-red-500' : 'text-white'}`}>
                {value}
            </span>
        </div>
    </div>
)
