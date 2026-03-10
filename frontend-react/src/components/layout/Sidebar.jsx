import React from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    ShieldAlert,
    Database,
    Settings,
    Activity,
    Zap,
    Globe,
    Lock,
    ChevronRight
} from 'lucide-react';

const Sidebar = ({ activeSection, setActiveSection }) => {
    const menuItems = [
        { id: 'operations', label: 'Operations', icon: LayoutDashboard, desc: 'Central Command' },
        { id: 'intelligence', label: 'Intelligence', icon: Globe, desc: 'Global Threat Map' },
        { id: 'vault', label: 'Identity Vault', icon: Lock, desc: 'Breach Forensics' },
        { id: 'analytics', label: 'Telemetry', icon: Activity, desc: 'Performance Data' },
        { id: 'config', label: 'Config', icon: Settings, desc: 'System Params' },
    ];

    return (
        <motion.aside
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-72 h-screen glass-surface border-r border-white/5 flex flex-col z-50 overflow-hidden"
        >
            {/* Brand Section */}
            <div className="p-8 pb-10 border-b border-white/5 relative group cursor-pointer">
                <div className="absolute inset-0 bg-accent-emerald/[0.02] group-hover:bg-accent-emerald/[0.05] transition-colors" />
                <div className="flex items-center gap-4 relative z-10 transition-transform group-hover:translate-x-1">
                    <div className="w-12 h-12 rounded-2xl bg-accent-emerald/10 border border-emerald-pro/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <ShieldAlert className="w-7 h-7 text-emerald-pro" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">
                            Phish<span className="text-emerald-pro">Blocker</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-pro rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            <span className="forensic-text text-[8px] tracking-[0.3em]">Neural OS v2.4</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nav Section */}
            <nav className="flex-1 p-6 space-y-2 mt-4 custom-scrollbar overflow-y-auto">
                <div className="px-3 mb-6">
                    <span className="forensic-text text-[9px] text-gray-600">Primary Navigation</span>
                </div>

                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`w-full group relative p-4 rounded-2xl transition-all duration-500 overflow-hidden ${isActive
                                    ? 'bg-accent-emerald/[0.08] border-emerald-pro/20'
                                    : 'hover:bg-white/[0.03] border-transparent'
                                } border group`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-pill"
                                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-emerald-pro rounded-r-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                />
                            )}

                            <div className="flex items-center gap-4 relative z-10">
                                <div className={`p-2 rounded-xl transition-all duration-500 ${isActive ? 'text-emerald-pro scale-110' : 'text-gray-500 group-hover:text-gray-300'
                                    }`}>
                                    <Icon size={22} className={isActive ? 'elite-status-glow' : ''} />
                                </div>
                                <div className="text-left flex-1">
                                    <div className={`text-xs font-black uppercase tracking-widest transition-colors ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-400'
                                        }`}>
                                        {item.label}
                                    </div>
                                    <div className="text-[9px] font-bold text-gray-700 uppercase tracking-widest mt-0.5 group-hover:text-gray-600 transition-colors">
                                        {item.desc}
                                    </div>
                                </div>
                                <ChevronRight size={14} className={`transition-all duration-500 ${isActive ? 'text-emerald-pro translate-x-0' : 'text-gray-800 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
                                    }`} />
                            </div>
                        </button>
                    );
                })}
            </nav>

            {/* Footer / System Status */}
            <div className="p-6 border-t border-white/5 bg-black/20">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="forensic-text text-[8px] text-gray-600">Neural Load</span>
                        <span className="text-[10px] font-mono text-emerald-pro font-black">ACTIVE</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '84%' }}
                            className="h-full bg-accent-emerald shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                        />
                    </div>
                </div>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
