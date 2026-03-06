import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './components/layout/Header'
import StatsCards from './components/dashboard/StatsCards'
import URLScanner from './components/dashboard/URLScanner'
import ThreatChart from './components/dashboard/ThreatChart'
import ActivityChart from './components/dashboard/ActivityChart'
import RecentScans from './components/dashboard/RecentScans'
import ModelInfo from './components/dashboard/ModelInfo'
import ModelPerformanceRadar from './components/dashboard/ModelPerformanceRadar'
import LiveIntelligenceFeed from './components/dashboard/LiveIntelligenceFeed'
import Settings from './components/dashboard/Settings'

function App() {
    const [view, setView] = useState('dashboard'); // 'dashboard' | 'settings'

    return (
        <div className="min-h-screen bg-[#020617] text-gray-200 font-sans selection:bg-accent-emerald/30 relative overflow-hidden">
            {/* Immersive Background Effects */}
            <div className="fixed inset-0 bg-mesh z-0" />
            <div className="fixed inset-0 noise-overlay z-[1] pointer-events-none" />

            {/* Animated Neural Pulses */}
            <div className="fixed inset-0 z-[2] pointer-events-none overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                        x: [0, 100, 0],
                        y: [0, 50, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1/4 -left-1/4 w-[80vw] h-[80vw] bg-accent-emerald/5 blur-[120px] rounded-full"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.4, 0.2],
                        x: [0, -100, 0],
                        y: [0, -50, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-1/4 -right-1/4 w-[70vw] h-[70vw] bg-accent-emerald/3 blur-[120px] rounded-full"
                />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <Header currentView={view} setView={setView} />

                <main className="flex-grow container mx-auto px-6 py-12 pb-32">
                    <header className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-[2px] bg-accent-emerald shadow-[0_0_10px_#10b981]" />
                                <div className="text-[10px] font-black text-accent-emerald uppercase tracking-[0.5em]">Command Hierarchy</div>
                            </div>
                            <h2 className="text-6xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                                Neural <span className="text-accent-emerald text-glow-emerald">Matrix</span>
                            </h2>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4 max-w-lg leading-relaxed">
                                Centralized forensic oversight and real-time threat neutralization telemetry across global neural endpoints.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-4 bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-5 rounded-[32px] neural-glow"
                        >
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Neural Sync Status</span>
                                <span className="text-[11px] font-black text-accent-emerald uppercase tracking-tighter">Fully Operational</span>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-accent-emerald/5 animate-pulse" />
                                <div className="w-2.5 h-2.5 rounded-full bg-accent-emerald shadow-[0_0_12px_#10b981] relative z-10" />
                            </div>
                        </motion.div>
                    </header>

                    {view === 'dashboard' ? (
                        <div className="space-y-12">
                            {/* Stats Overview */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                            >
                                <StatsCards />
                            </motion.div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                {/* URL Scanner Section */}
                                <motion.div
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.8, delay: 0.4 }}
                                    className="lg:col-span-4"
                                >
                                    <div className="h-full">
                                        <URLScanner />
                                    </div>
                                </motion.div>

                                {/* Analysis Grid */}
                                <div className="lg:col-span-8 space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.8, delay: 0.5 }}
                                            className="glass-panel p-10 rounded-[48px]"
                                        >
                                            <ThreatChart />
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.8, delay: 0.6 }}
                                            className="glass-panel p-10 rounded-[48px]"
                                        >
                                            <ActivityChart />
                                        </motion.div>
                                    </div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, delay: 0.7 }}
                                    >
                                        <RecentScans />
                                    </motion.div>
                                </div>
                            </div>

                            {/* Secondary Data Layer */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.8, delay: 0.8 }}
                                    className="glass-panel p-10 rounded-[48px]"
                                >
                                    <ModelPerformanceRadar />
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.8, delay: 0.9 }}
                                    className="glass-panel p-10 rounded-[48px] lg:col-span-1"
                                >
                                    <LiveIntelligenceFeed />
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.8, delay: 1.0 }}
                                    className="lg:col-span-1"
                                >
                                    <ModelInfo />
                                </motion.div>
                            </div>
                        </div>
                    ) : (
                        <Settings />
                    )}
                </main>

                <footer className="py-16 border-t border-white/5 bg-black/40 backdrop-blur-3xl relative z-10">
                    <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col gap-2">
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em]">
                                PhishBlocker Protocol v4.5.1
                            </div>
                            <div className="text-[9px] font-bold text-gray-700 uppercase tracking-widest">
                                Encrypted Neural Telemetry Channel
                            </div>
                        </div>
                        <div className="flex items-center gap-12">
                            <div className="flex flex-col items-end gap-1">
                                <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Integrity Verification</div>
                                <div className="text-[9px] font-black text-accent-emerald uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
                                    System Optimal
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    )
}

export default App
