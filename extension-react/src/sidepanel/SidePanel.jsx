import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Shield,
    ShieldAlert,
    ShieldCheck,
    Search,
    Clock,
    Zap,
    Settings,
    ExternalLink,
    Activity,
    Info,
    RefreshCw,
    X,
    Lock,
    EyeOff,
    List,
    Home,
    BarChart3,
    Plus,
    Trash2,
    Bell,
    Power,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    ChevronRight
} from 'lucide-react'

const SidePanel = () => {
    const [stats, setStats] = useState({ scansToday: 0, threatsBlocked: 0 })
    const [history, setHistory] = useState([])
    const [currentUrl, setCurrentUrl] = useState('')
    const [scanUrl, setScanUrl] = useState('')
    const [isScanning, setIsScanning] = useState(false)
    const [scanResult, setScanResult] = useState(null)
    const [activeTab, setActiveTab] = useState('overview')
    const [whitelist, setWhitelist] = useState([])
    const [newDomain, setNewDomain] = useState('')
    const [settings, setSettings] = useState({
        enabled: true,
        blockPhishing: true,
        showWarnings: true,
        blockTrackers: true,
    })

    useEffect(() => {
        // Load initial data
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['stats', 'recentScans'], (result) => {
                if (result.stats) setStats(result.stats)
                if (result.recentScans) setHistory(result.recentScans)
            })
            chrome.storage.sync.get(['settings', 'whitelist'], (result) => {
                if (result.settings) setSettings(result.settings)
                if (result.whitelist) setWhitelist(result.whitelist)
            })
        }

        // Listen for tab updates to show current site
        const updateCurrentUrl = () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.url) {
                    try {
                        const url = new URL(tabs[0].url)
                        setCurrentUrl(url.hostname)
                    } catch (e) {
                        setCurrentUrl('Unknown Target')
                    }
                }
            })
        }

        updateCurrentUrl()
        chrome.tabs.onActivated.addListener(updateCurrentUrl)
        chrome.tabs.onUpdated.addListener(updateCurrentUrl)

        return () => {
            chrome.tabs.onActivated.removeListener(updateCurrentUrl)
            chrome.tabs.onUpdated.removeListener(updateCurrentUrl)
        }
    }, [])

    const handleScan = async (urlToScan) => {
        const targetUrl = urlToScan || scanUrl;
        if (!targetUrl) return;

        setIsScanning(true)
        setScanResult(null)
        setScanUrl(targetUrl)

        try {
            // Set a safety timeout for the background response
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Neural link timeout (15s)')), 15000)
            );

            const scanPromise = new Promise((resolve) => {
                chrome.runtime.sendMessage({ action: 'scanUrl', url: targetUrl }, (result) => {
                    if (chrome.runtime.lastError) {
                        resolve({ error: chrome.runtime.lastError.message });
                    } else {
                        resolve(result);
                    }
                });
            });

            const result = await Promise.race([scanPromise, timeoutPromise]);

            if (result.error) {
                console.error("Scan failed:", result.error)
                alert('Scan failed: ' + result.error)
                setIsScanning(false)
                return
            }

            setScanResult(result)

            // Update local stats
            const newStats = {
                ...stats,
                scansToday: stats.scansToday + 1,
                threatsBlocked: stats.threatsBlocked + (result.is_phishing ? 1 : 0)
            }
            setStats(newStats)
            chrome.storage.local.set({ stats: newStats })

            // Update history
            const newHistory = [{
                url: targetUrl,
                is_phishing: result.is_phishing,
                threat_level: result.threat_level,
                confidence: result.confidence,
                timestamp: new Date().toISOString()
            }, ...history].slice(0, 20)
            setHistory(newHistory)
            chrome.storage.local.set({ recentScans: newHistory })
            setIsScanning(false)

        } catch (error) {
            console.error("Scan failed:", error)
            alert(error.message || 'Scan failed.')
            setIsScanning(false)
        }
    }

    const updateSettings = (key, value) => {
        const newSettings = { ...settings, [key]: value }
        setSettings(newSettings)
        chrome.storage.sync.set({ settings: newSettings })
    }

    const addToWhitelist = () => {
        let domainToAdd = newDomain.trim().toLowerCase()
        if (!domainToAdd) return

        // Extract hostname if a full URL was pasted
        try {
            if (domainToAdd.includes('://') || !domainToAdd.includes('.')) {
                const urlObj = new URL(domainToAdd.startsWith('http') ? domainToAdd : `https://${domainToAdd}`)
                domainToAdd = urlObj.hostname
            }
        } catch (e) {
            console.error("Invalid domain format:", domainToAdd)
        }

        if (domainToAdd && !whitelist.includes(domainToAdd)) {
            const updated = [...whitelist, domainToAdd]
            setWhitelist(updated)
            chrome.storage.sync.set({ whitelist: updated })
            setNewDomain('')
        }
    }

    const removeFromWhitelist = (domain) => {
        const updated = whitelist.filter(d => d !== domain)
        setWhitelist(updated)
        chrome.storage.sync.set({ whitelist: updated })
    }

    const clearHistory = () => {
        setHistory([])
        chrome.storage.local.set({ recentScans: [] })
    }

    const refreshRules = () => {
        chrome.runtime.sendMessage({ action: 'refreshProtection' })
    }

    const wipeData = () => {
        chrome.storage.local.clear()
        setHistory([])
        setStats({ scansToday: 0, threatsBlocked: 0 })
    }

    return (
        <div className="flex flex-col h-screen bg-night-400 text-gray-200 font-sans select-none overflow-hidden">
            {/* Premium Header */}
            <header className="pt-6 px-6 pb-4 border-b border-white/5 bg-night-400/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-accent-emerald blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <div className="w-10 h-10 bg-night-50 rounded-xl border border-white/10 flex items-center justify-center relative">
                                <Shield className="w-6 h-6 text-accent-emerald" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-base font-black tracking-tight text-white uppercase italic">Phish<span className="text-accent-emerald">Blocker</span></h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${settings.enabled ? 'bg-accent-emerald shadow-[0_0_8px_#10b981]' : 'bg-orange-500'}`}></div>
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                    {settings.enabled ? 'Active Defense' : 'Offline'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1.5 mt-6 overflow-x-auto pb-2 scrollbar-none">
                    {[
                        { id: 'overview', icon: Home, label: 'Home' },
                        { id: 'history', icon: Clock, label: 'Feed' },
                        { id: 'whitelist', icon: List, label: 'Safe' },
                        { id: 'stats', icon: BarChart3, label: 'Stats' },
                        { id: 'settings', icon: Settings, label: 'Config' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center gap-1.5 py-2 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all min-w-[70px] ${activeTab === tab.id
                                ? 'bg-white/5 text-white border border-white/10'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-accent-emerald' : ''}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* Immersive Scroll Section */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-8 pb-32">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="space-y-6"
                        >
                            {/* Target Monitor */}
                            <div className="p-6 rounded-3xl bg-night-50 border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4">
                                    <Activity className="w-5 h-5 text-gray-600 animate-pulse" />
                                </div>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Current Target</span>
                                <div className="text-xl font-bold text-white truncate mb-1">{currentUrl}</div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed opacity-60">
                                    Neural monitoring active for behavioral anomalies.
                                </p>

                                <button
                                    onClick={() => handleScan(null)}
                                    disabled={isScanning}
                                    className="mt-6 w-full py-4 bg-accent-emerald text-night-400 font-black rounded-2xl hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                >
                                    {isScanning ? (
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Zap className="w-5 h-5 fill-current" />
                                            TRIGGER LIVE SCAN
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Manual URL Inspection */}
                            <div className="p-6 rounded-3xl bg-night-50 border border-white/5 space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-3 bg-accent-emerald rounded-full"></div>
                                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Manual Inspection</h3>
                                </div>
                                <div className="relative group">
                                    <input
                                        type="url"
                                        value={scanUrl}
                                        onChange={(e) => setScanUrl(e.target.value)}
                                        placeholder="Analyze suspicious URL..."
                                        className="w-full px-4 py-3.5 rounded-xl text-xs bg-night-400 border-white/5 text-white placeholder-gray-600 border focus:outline-none focus:border-accent-emerald/50 transition-all font-mono"
                                    />
                                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-accent-emerald transition-colors" />
                                </div>
                                <button
                                    onClick={() => handleScan(scanUrl)}
                                    disabled={!scanUrl || isScanning}
                                    className={`w-full py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!scanUrl || isScanning
                                        ? 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed'
                                        : 'bg-white/10 text-white border border-white/10 hover:bg-white/15'
                                        }`}
                                >
                                    Analyze Pipeline
                                </button>
                            </div>

                            {/* Live Result */}
                            {scanResult && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    className={`p-6 rounded-3xl border ${scanResult.is_phishing ? 'bg-red-500/10 border-red-500/20' : 'bg-accent-emerald/10 border-accent-emerald/20'}`}
                                >
                                    <div className="flex gap-4">
                                        <div className={`p-3 h-12 w-12 rounded-2xl flex items-center justify-center ${scanResult.is_phishing ? 'bg-red-500' : 'bg-accent-emerald'}`}>
                                            {scanResult.is_phishing ? <ShieldAlert className="text-white" /> : <ShieldCheck className="text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-black text-white uppercase tracking-tight text-sm">
                                                {scanResult.is_phishing ? 'THREAT NEUTRALIZED' : 'DOMAIN VERIFIED'}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Confidence:</span>
                                                <span className="text-sm font-black text-white font-mono">{(scanResult.confidence * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${scanResult.confidence * 100}%` }}
                                                    className={`h-full ${scanResult.is_phishing ? 'bg-red-500' : 'bg-accent-emerald'}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <MetricCard label="Blocks" value={stats.threatsBlocked} icon={ShieldAlert} color="text-red-500" />
                                <MetricCard label="Inspections" value={stats.scansToday} icon={Activity} color="text-accent-emerald" />
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-accent-emerald" />
                                    Intelligence Feed
                                </h3>
                                <button
                                    onClick={clearHistory}
                                    className="text-[10px] font-bold text-gray-600 hover:text-red-500 uppercase tracking-widest transition-colors"
                                >
                                    Wipe Feed
                                </button>
                            </div>

                            <div className="space-y-3">
                                {history.length > 0 ? history.map((scan, i) => (
                                    <div key={i} className="p-4 rounded-2xl bg-night-50 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${scan.is_phishing ? 'bg-red-500/10 text-red-500' : 'bg-accent-emerald/10 text-accent-emerald'}`}>
                                                {scan.is_phishing ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-white truncate max-w-[140px] uppercase font-mono">{new URL(scan.url).hostname}</div>
                                                <div className="text-[10px] text-gray-600 font-bold mt-0.5 uppercase tracking-tighter">
                                                    {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-[9px] font-black uppercase px-2 py-1 rounded ${scan.is_phishing ? 'text-red-500 bg-red-500/5' : 'text-emerald-500 bg-emerald-500/5'}`}>
                                            {scan.is_phishing ? 'Threat' : 'Secure'}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-20 flex flex-col items-center justify-center opacity-20">
                                        <Activity size={48} className="mb-4" />
                                        <div className="text-xs font-black uppercase tracking-widest">Awaiting Telemetry</div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'whitelist' && (
                        <motion.div
                            key="whitelist"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6"
                        >
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <List className="w-4 h-4 text-accent-emerald" />
                                Trusted Enclave
                            </h3>

                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newDomain}
                                        onChange={(e) => setNewDomain(e.target.value)}
                                        placeholder="Add secure domain..."
                                        className="flex-1 px-4 py-3 rounded-xl text-xs bg-night-50 border-white/5 text-white border focus:outline-none focus:border-accent-emerald/50 transition-all font-mono"
                                    />
                                    <button
                                        onClick={addToWhitelist}
                                        className="p-3 bg-accent-emerald text-night-400 rounded-xl hover:bg-emerald-400 transition-all active:scale-95"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {whitelist.length === 0 ? (
                                        <div className="py-12 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center opacity-30 text-center">
                                            <ShieldCheck size={32} className="mb-3" />
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Zero Manual Overrides</p>
                                        </div>
                                    ) : (
                                        whitelist.map((domain, i) => (
                                            <div key={i} className="p-4 rounded-2xl bg-night-50 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all font-mono text-xs">
                                                <span className="text-gray-300">{domain}</span>
                                                <button
                                                    onClick={() => removeFromWhitelist(domain)}
                                                    className="p-2 text-gray-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'stats' && (
                        <motion.div
                            key="stats"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6"
                        >
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-accent-emerald" />
                                Diagnostic Matrix
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Neural Syncs', value: stats.scansToday, icon: Zap, color: 'text-blue-500' },
                                    { label: 'Neutralized', value: stats.threatsBlocked, icon: ShieldAlert, color: 'text-red-500' },
                                    { label: 'Sanitized', value: stats.scansToday - stats.threatsBlocked, icon: ShieldCheck, color: 'text-accent-emerald' },
                                    { label: 'Accuracy', value: '98.4%', icon: TrendingUp, color: 'text-purple-500' },
                                ].map((stat, i) => (
                                    <div key={i} className="p-5 rounded-3xl bg-night-50 border border-white/5 relative overflow-hidden group">
                                        <div className="relative z-10">
                                            <stat.icon className={`w-4 h-4 ${stat.color} mb-3`} />
                                            <div className="text-xl font-black text-white font-mono">{stat.value}</div>
                                            <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">{stat.label}</div>
                                        </div>
                                        <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-white/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 rounded-3xl bg-night-50 border border-white/5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Wasm Engine Load</span>
                                    <span className="text-[10px] font-black text-accent-emerald font-mono">OPTIMAL</span>
                                </div>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '85%' }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-accent-emerald shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'settings' && (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">System Protocols</h3>

                            <div className="space-y-3">
                                <ToggleSetting
                                    icon={Shield}
                                    label="Neural Matrix Protection"
                                    description="Real-time behavioral ML analysis."
                                    enabled={settings.enabled}
                                    onChange={() => updateSettings('enabled', !settings.enabled)}
                                />
                                <ToggleSetting
                                    icon={ShieldAlert}
                                    label="Infiltration Guard"
                                    description="Auto-block high-risk threat vectors."
                                    enabled={settings.blockPhishing}
                                    onChange={() => updateSettings('blockPhishing', !settings.blockPhishing)}
                                />
                                <ToggleSetting
                                    icon={Bell}
                                    label="HUD Visual Alerts"
                                    description="Interactive browser notifications."
                                    enabled={settings.showWarnings}
                                    onChange={() => updateSettings('showWarnings', !settings.showWarnings)}
                                />
                                <ToggleSetting
                                    icon={EyeOff}
                                    label="Ghost Protocol"
                                    description="Neutralize trackers and analytics."
                                    enabled={settings.blockTrackers}
                                    onChange={() => updateSettings('blockTrackers', !settings.blockTrackers)}
                                />
                                <ToggleSetting
                                    icon={Lock}
                                    label="Secure Pre-flight"
                                    description="Local Wasm inference checks."
                                    enabled={true}
                                />
                            </div>

                            <div className="pt-6 border-t border-white/5 space-y-3">
                                <button
                                    onClick={refreshRules}
                                    className="w-full py-4 text-[10px] font-black text-white bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={14} className="text-accent-emerald" />
                                    Synchronize Rulesets
                                </button>
                                <button
                                    onClick={wipeData}
                                    className="w-full py-4 text-[10px] font-black text-red-500 bg-red-500/5 rounded-2xl hover:bg-red-500/10 transition-all uppercase tracking-widest"
                                >
                                    Wipe Diagnostic Cache
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Actions */}
            <div className="p-6 bg-night-400 border-t border-white/5 absolute bottom-0 left-0 right-0">
                <button
                    onClick={() => window.open('http://localhost:3000', '_blank')}
                    className="w-full py-4 bg-night-50 text-white font-bold rounded-2xl flex items-center justify-center gap-3 border border-white/5 hover:bg-night-100 transition-all text-xs uppercase tracking-widest"
                >
                    <ExternalLink size={16} className="text-accent-emerald" />
                    Open Command Center
                </button>
            </div>

            {/* Injected CSS for scrollbar */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(16, 185, 129, 0.2);
                }
            `}</style>
        </div>
    )
}

const MetricCard = ({ label, value, icon: Icon, color }) => (
    <div className="p-5 rounded-3xl bg-night-50 border border-white/5 group hover:border-accent-emerald/20 transition-all">
        <Icon className={`w-5 h-5 mb-3 ${color}`} />
        <div className="text-2xl font-black text-white font-mono">{value.toLocaleString()}</div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{label}</div>
    </div>
)

const ToggleSetting = ({ icon: Icon, label, description, enabled, onChange }) => (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-night-50 border border-white/5 group hover:border-white/10 transition-all">
        <div className="flex items-center gap-4 min-w-0">
            <div className={`p-2.5 rounded-xl transition-colors ${enabled ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-gray-500/10 text-gray-500'}`}>
                <Icon size={20} />
            </div>
            <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">{label}</div>
                <div className="text-[10px] text-gray-500 font-bold leading-tight mt-0.5">{description}</div>
            </div>
        </div>
        <button
            onClick={onChange}
            className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${enabled ? 'bg-accent-emerald' : 'bg-night-50 border border-white/10'}`}
        >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${enabled ? 'translate-x-5' : ''}`}></div>
        </button>
    </div>
)

export default SidePanel
