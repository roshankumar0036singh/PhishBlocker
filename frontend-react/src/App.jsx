import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Sidebar from './components/layout/Sidebar'
import URLScanner from './components/dashboard/URLScanner'
import StatsCards from './components/dashboard/StatsCards'
import RecentScans from './components/dashboard/RecentScans'
import ThreatChart from './components/dashboard/ThreatChart'
import ActivityChart from './components/dashboard/ActivityChart'
import ModelPerformanceRadar from './components/dashboard/ModelPerformanceRadar'
import LiveIntelligenceFeed from './components/dashboard/LiveIntelligenceFeed'
import ModelInfo from './components/dashboard/ModelInfo'
import IdentityVault from './components/dashboard/IdentityVault'
import Settings from './components/dashboard/Settings'
import { Search } from 'lucide-react'

const queryClient = new QueryClient()

function AppContent() {
    const [activeSection, setActiveSection] = useState('operations')

    return (
        <div className="flex h-screen bg-elite-dark overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute inset-0 neural-grid pointer-events-none opacity-50" />
            <div className="absolute inset-0 scanning-line pointer-events-none" />

            {/* Sidebar Navigation */}
            <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

            {/* Main Command Center */}
            <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
                <header className="h-24 px-10 flex items-center justify-between border-b border-white/5 sticky top-0 bg-elite-dark/80 backdrop-blur-xl z-20">
                    <div className="flex items-center gap-6">
                        <div className="px-4 py-1.5 bg-emerald-pro/10 border border-emerald-pro/20 rounded-full">
                            <span className="forensic-text text-[9px] text-emerald-pro">System Ready</span>
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">
                            {activeSection} <span className="text-emerald-pro text-glow-emerald">Matrix</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global Latency</span>
                            <span className="text-xs font-mono text-emerald-pro">14ms</span>
                        </div>
                        <div className="w-px h-8 bg-white/5 mx-2" />
                        <button className="p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-emerald-pro/10 hover:border-emerald-pro/30 transition-all group">
                            <Search size={18} className="text-gray-500 group-hover:text-emerald-pro" />
                        </button>
                    </div>
                </header>

                <div className="p-10 max-w-[1600px] mx-auto space-y-10">
                    <AnimatePresence mode="wait">
                        {activeSection === 'operations' && (
                            <motion.div
                                key="ops"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-10"
                            >
                                {/* Top Layer: Scanner & Stats */}
                                <div className="grid grid-cols-12 gap-8">
                                    <div className="col-span-8">
                                        <URLScanner />
                                    </div>
                                    <div className="col-span-4 flex flex-col gap-6">
                                        <StatsCards />
                                    </div>
                                </div>

                                {/* Middle Layer: Telemetry Grid */}
                                <div className="grid grid-cols-3 gap-8">
                                    <div className="col-span-2 shadow-[0_0_50px_rgba(16,185,129,0.02)]">
                                        <ActivityChart />
                                    </div>
                                    <div className="shadow-[0_0_50px_rgba(16,185,129,0.02)]">
                                        <ThreatChart />
                                    </div>
                                </div>

                                {/* Bottom Layer: Logs & Intelligence */}
                                <div className="grid grid-cols-12 gap-8 pb-10">
                                    <div className="col-span-7">
                                        <RecentScans />
                                    </div>
                                    <div className="col-span-5">
                                        <LiveIntelligenceFeed />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeSection === 'intelligence' && (
                            <motion.div
                                key="intelligence"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid grid-cols-2 gap-8"
                            >
                                <ModelInfo />
                                <ModelPerformanceRadar />
                            </motion.div>
                        )}

                        {activeSection === 'vault' && (
                            <motion.div
                                key="vault"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                            >
                                <IdentityVault />
                            </motion.div>
                        )}

                        {activeSection === 'config' && (
                            <motion.div
                                key="config"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <Settings />
                            </motion.div>
                        )}

                        {activeSection === 'analytics' && (
                            <motion.div
                                key="analytics"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-3 gap-8"
                            >
                                <div className="col-span-2"><ActivityChart /></div>
                                <ThreatChart />
                                <ModelPerformanceRadar />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    )
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AppContent />
        </QueryClientProvider>
    )
}

export default App
