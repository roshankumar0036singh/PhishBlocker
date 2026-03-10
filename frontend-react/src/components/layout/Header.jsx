import { Shield, Moon, Sun, Activity, Command, Settings as SettingsIcon, LayoutDashboard, Fingerprint } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Header({ currentView, setView }) {
    return (
        <header className="bg-black/40 backdrop-blur-2xl border-b border-white/[0.03] sticky top-0 z-[100] elite-border">
            <div className="container mx-auto px-8 py-6">
                <div className="flex items-center justify-between">
                    {/* Logo and Title */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6"
                    >
                        <div className="relative group cursor-pointer">
                            <div className="absolute inset-0 bg-accent-emerald blur-2xl opacity-10 group-hover:opacity-30 transition-opacity duration-1000"></div>
                            <div className="p-3.5 bg-black/60 rounded-2xl border border-white/10 relative transition-all duration-700 group-hover:border-accent-emerald/40 neural-pulse-emerald">
                                <Shield className="w-6 h-6 text-accent-emerald text-glow-emerald" />
                            </div>
                            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-400 rounded-full border-2 border-night-900 shadow-[0_0_8px_#f87171]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-xl font-black text-white uppercase tracking-tighter leading-none group-hover:text-accent-emerald transition-colors">
                                    PHISH<span className="text-accent-emerald text-glow-emerald">BLOCKER</span>
                                </h1>
                                <div className="px-2 py-0.5 bg-accent-emerald/10 border border-accent-emerald/20 rounded-md text-[7px] font-black text-accent-emerald uppercase tracking-[0.2em] shadow-[0_0_10px_rgba(16,185,129,0.1)]">ELITE_CORE</div>
                            </div>
                            <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em] flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald/40 animate-pulse" />
                                GLOBAL INTELLIGENCE MESH
                            </p>
                        </div>
                    </motion.div>

                    {/* Actions & Status */}
                    <div className="flex items-center gap-12">
                        {/* Navigation Controls */}
                        <div className="flex items-center gap-1.5 bg-black/60 border border-white/5 p-1 rounded-2xl elite-border">
                            <NavButton
                                active={currentView === 'dashboard'}
                                onClick={() => setView('dashboard')}
                                icon={LayoutDashboard}
                                label="Operations"
                                activeColor="accent-emerald"
                            />
                            <NavButton
                                active={currentView === 'vault'}
                                onClick={() => setView('vault')}
                                icon={Fingerprint}
                                label="Identity"
                                activeColor="red-500"
                            />
                            <NavButton
                                active={currentView === 'settings'}
                                onClick={() => setView('settings')}
                                icon={SettingsIcon}
                                label="Config"
                                activeColor="accent-emerald"
                            />
                        </div>

                        {/* API Status */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="hidden lg:flex items-center gap-5 px-5 py-2.5 bg-black/60 border border-white/5 rounded-2xl group cursor-help transition-all duration-500 elite-border"
                        >
                            <div className="relative">
                                <div className="w-2 h-2 bg-accent-emerald rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                                <div className="absolute inset-0 bg-accent-emerald rounded-full animate-ping opacity-20"></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-white uppercase tracking-[0.2em] group-hover:text-accent-emerald transition-colors">
                                    NEURAL LINK ACTIVE
                                </span>
                                <span className="text-[7px] font-black text-gray-800 uppercase tracking-widest leading-none mt-1">LATENCY: 42MS</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </header>
    )
}

function NavButton({ active, onClick, icon: Icon, label, activeColor }) {
    const colorClass = activeColor === 'red-500' ? 'text-red-500' : 'text-accent-emerald';
    const bgClass = activeColor === 'red-500' ? 'bg-red-500' : 'bg-accent-emerald';
    const shadowClass = activeColor === 'red-500' ? 'shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'shadow-[0_0_20px_rgba(16,185,129,0.3)]';

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl transition-all duration-500 text-[9px] font-black uppercase tracking-[0.2em] border ${active
                ? `${bgClass} text-night-900 border-transparent ${shadowClass}`
                : `text-gray-700 border-transparent hover:text-white hover:bg-white/[0.03] hover:border-white/5`
                }`}
        >
            <Icon size={14} className={active ? 'animate-pulse' : ''} />
            <span className="hidden xl:inline">{label}</span>
        </button>
    )
}