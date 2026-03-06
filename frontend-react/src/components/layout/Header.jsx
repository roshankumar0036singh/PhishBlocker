import { Shield, Moon, Sun, Activity, Command, Settings as SettingsIcon, LayoutDashboard } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Header({ currentView, setView }) {
    return (
        <header className="bg-black/30 backdrop-blur-3xl border-b border-white/[0.03] sticky top-0 z-[100]">
            <div className="container mx-auto px-8 py-7">
                <div className="flex items-center justify-between">
                    {/* Logo and Title */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="relative group">
                            <div className="absolute inset-0 bg-accent-emerald blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
                            <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/10 relative backdrop-blur-xl group-hover:border-accent-emerald/30 transition-all duration-700">
                                <Shield className="w-7 h-7 text-accent-emerald text-glow-emerald" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-night-400 group-hover:animate-ping" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">
                                    Phish<span className="text-accent-emerald">Blocker</span>
                                </h1>
                                <div className="px-2 py-0.5 bg-accent-emerald/10 border border-accent-emerald/20 rounded text-[8px] font-black text-accent-emerald uppercase tracking-widest">Enterprise</div>
                            </div>
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] flex items-center gap-2">
                                <Command size={10} className="text-accent-emerald" />
                                Neural Defense Matrix
                            </p>
                        </div>
                    </motion.div>

                    {/* Actions & Status */}
                    <div className="flex items-center gap-10">
                        {/* Navigation Controls */}
                        <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 p-1 rounded-2xl">
                            <button
                                onClick={() => setView('dashboard')}
                                className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-500 text-[10px] font-black uppercase tracking-widest ${currentView === 'dashboard'
                                        ? 'bg-accent-emerald text-black'
                                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <LayoutDashboard size={14} />
                                <span className="hidden lg:inline">Neural Dashboard</span>
                            </button>
                            <button
                                onClick={() => setView('settings')}
                                className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-500 text-[10px] font-black uppercase tracking-widest ${currentView === 'settings'
                                        ? 'bg-accent-emerald text-black'
                                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <SettingsIcon size={14} />
                                <span className="hidden lg:inline">Command Settings</span>
                            </button>
                        </div>

                        <div className="hidden md:flex items-center gap-8">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest mb-1">Response Latency</span>
                                <span className="text-[10px] font-black text-accent-emerald font-mono tracking-tighter">14ms / Secure</span>
                            </div>
                            <div className="w-[1px] h-8 bg-white/5" />
                        </div>

                        {/* API Status */}
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center gap-5 px-6 py-3 bg-white/[0.02] border border-white/5 rounded-2xl group cursor-help transition-all duration-500"
                        >
                            <div className="relative">
                                <div className="w-2.5 h-2.5 bg-accent-emerald rounded-full animate-pulse shadow-[0_0_12px_#10b981]"></div>
                                <div className="absolute inset-0 bg-accent-emerald rounded-full animate-ping opacity-20"></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] group-hover:text-accent-emerald transition-colors">
                                    Neural Link Active
                                </span>
                                <span className="text-[8px] font-bold text-gray-700 uppercase tracking-widest">Telemetry 1:1</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </header>
    )
}
