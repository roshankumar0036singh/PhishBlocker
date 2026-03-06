import { motion } from 'framer-motion';
import { Shield, Zap, Target, Globe, Server, Hash } from 'lucide-react';

const events = [
    { id: 1, type: 'Intercept', detail: 'Zero-day redirect neutralized', origin: 'US-EAST', time: '0.2s', icon: Shield, color: 'text-red-500' },
    { id: 2, type: 'Compute', detail: 'Deep lexical analysis complete', origin: 'EU-WEST', time: '1.4s', icon: Zap, color: 'text-accent-emerald' },
    { id: 3, type: 'Heuristic', detail: 'Homograph pattern identified', origin: 'ASIA-SC', time: '2.1s', icon: Target, color: 'text-amber-500' },
    { id: 4, type: 'Neural', detail: 'Synaptic weights synchronized', origin: 'CENTRAL', time: '5.8s', icon: Globe, color: 'text-blue-500' },
    { id: 5, type: 'Node', detail: 'Edge cluster heartbeat active', origin: 'NODE-04', time: '8.2s', icon: Server, color: 'text-purple-500' },
];

export default function LiveIntelligenceFeed() {
    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse shadow-[0_0_8px_#10b981]" />
                    <span className="text-[10px] font-black text-accent-emerald uppercase tracking-[0.3em]">Synapse Pulse Stream</span>
                </div>
                <div className="flex gap-1.5">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-1 h-3 rounded-full bg-accent-emerald/10" />
                    ))}
                </div>
            </div>

            <div className="flex-1 space-y-3 overflow-hidden">
                {events.map((event, index) => (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className="flex items-start gap-5 p-5 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] hover:border-white/10 transition-all duration-500 group"
                    >
                        <div className={`p-2.5 rounded-xl bg-white/[0.03] border border-white/5 group-hover:border-white/10 transition-all ${event.color}`}>
                            <event.icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{event.type}</span>
                                <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest font-mono">{event.time}</span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-600 truncate group-hover:text-gray-400 transition-colors uppercase tracking-tight">{event.detail}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="text-[8px] font-black text-gray-600 px-2 py-0.5 border border-white/5 rounded-md bg-white/[0.01] uppercase tracking-tighter">
                                {event.origin}
                            </div>
                            <Hash size={8} className="text-gray-800" />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.2em] mb-1">Throughput</span>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">1.2GB/s Secure</span>
                </div>
                <div className="flex items-center gap-3 bg-accent-emerald/5 border border-accent-emerald/10 px-4 py-2 rounded-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
                    <span className="text-[9px] font-black text-accent-emerald uppercase tracking-[0.2em]">Active Sync</span>
                </div>
            </div>
        </div>
    );
}
