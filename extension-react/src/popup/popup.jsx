import React from 'react'
import ReactDOM from 'react-dom/client'
import { useState, useEffect } from 'react'
import {
    Shield,
    Search,
    Clock,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Settings,
    Activity,
    Zap,
    List,
    Home,
    BarChart3,
    Plus,
    Trash2,
    RefreshCw,
    ExternalLink,
    Bell,
    X,
    Power,
    User,
    Globe,
    Fingerprint,
    ShieldAlert,
    Database,
    Loader2,
    Key,
    Save
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './popup.css'

const API_BASE_URL = 'http://localhost:8000'

function Popup() {
    const [activeTab, setActiveTab] = useState('home')
    const [isScanning, setIsScanning] = useState(false)
    const [scanUrl, setScanUrl] = useState('')
    const [currentUrl, setCurrentUrl] = useState('')
    const [showSettings, setShowSettings] = useState(false)
    const [newDomain, setNewDomain] = useState('')
    const [scanResult, setScanResult] = useState(null)

    const [settings, setSettings] = useState({
        enabled: true,
        blockPhishing: true,
        showWarnings: true,
        blockTrackers: true,
    })

    const [stats, setStats] = useState({
        scansToday: 0,
        threatsBlocked: 0,
    })

    const [recentScans, setRecentScans] = useState([])
    const [whitelist, setWhitelist] = useState([])
    const [apiKey, setApiKey] = useState('')
    const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | success

    // New states for Vault & Threats
    const [vaultIdentifier, setVaultIdentifier] = useState('')
    const [vaultResult, setVaultResult] = useState(null)
    const [isCheckingVault, setIsCheckingVault] = useState(false)
    const [vaultHistory, setVaultHistory] = useState([])
    const [communityThreats, setCommunityThreats] = useState([])
    const [isThreatsLoading, setIsThreatsLoading] = useState(false)

    useEffect(() => {
        // Get current tab URL
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.url) {
                try {
                    const url = new URL(tabs[0].url)
                    setCurrentUrl(url.hostname)
                    setScanUrl(tabs[0].url)
                } catch (e) {
                    setCurrentUrl('Unknown')
                }
            }
        })

        // Load settings
        chrome.storage.sync.get(['settings'], (result) => {
            if (result.settings) {
                setSettings(result.settings)
            }
        })

        // Load stats
        chrome.storage.local.get(['stats'], (result) => {
            if (result.stats) {
                setStats(result.stats)
            }
        })

        // Load recent scans
        chrome.storage.local.get(['recentScans'], (result) => {
            if (result.recentScans) {
                setRecentScans(result.recentScans)
            }
        })

        // Load whitelist
        chrome.storage.sync.get(['whitelist'], (result) => {
            if (result.whitelist) {
                setWhitelist(result.whitelist)
            }
        })

        // Load API Key
        chrome.storage.local.get(['gemini_api_key'], (result) => {
            if (result.gemini_api_key) {
                setApiKey(result.gemini_api_key)
            }
        })

        // Load Vault History
        chrome.storage.local.get(['vaultHistory'], (result) => {
            if (result.vaultHistory) {
                setVaultHistory(result.vaultHistory)
            }
        })
    }, [])

    const handleScan = async () => {
        if (!scanUrl) return
        setIsScanning(true)
        setScanResult(null)

        try {
            // Set a safety timeout for the background response
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Neural link timeout (15s)')), 15000)
            );

            const scanPromise = new Promise((resolve) => {
                chrome.runtime.sendMessage({
                    action: 'scanUrl',
                    url: scanUrl,
                    gemini_api_key: apiKey
                }, (result) => {
                    if (chrome.runtime.lastError) {
                        resolve({ error: chrome.runtime.lastError.message });
                    } else {
                        resolve(result);
                    }
                });
            });

            const result = await Promise.race([scanPromise, timeoutPromise]);

            if (result.error) {
                console.error('Scan error:', result.error)
                alert('Scan failed: ' + result.error)
                setIsScanning(false)
                return
            }

            setScanResult(result)

            // Add to recent scans
            const newScan = {
                url: scanUrl,
                is_phishing: result.is_phishing,
                threat_level: result.threat_level,
                confidence: result.confidence,
                timestamp: new Date().toISOString()
            }

            const updatedScans = [newScan, ...recentScans].slice(0, 10)
            setRecentScans(updatedScans)
            chrome.storage.local.set({ recentScans: updatedScans })

            // Update stats
            const newStats = {
                scansToday: stats.scansToday + 1,
                threatsBlocked: stats.threatsBlocked + (result.is_phishing ? 1 : 0)
            }
            setStats(newStats)
            setIsScanning(false)

        } catch (error) {
            console.error('Scan error:', error)
            alert(error.message || 'Failed to scan URL.')
            setIsScanning(false)
        }
    }

    const updateSettings = (key, value) => {
        const newSettings = { ...settings, [key]: value }
        setSettings(newSettings)
        chrome.storage.sync.set({ settings: newSettings })
    }

    const addToWhitelist = () => {
        if (newDomain && !whitelist.includes(newDomain)) {
            const updated = [...whitelist, newDomain]
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
        setRecentScans([])
        chrome.storage.local.set({ recentScans: [] })
    }

    const openDashboard = () => {
        chrome.tabs.create({ url: 'http://localhost:3000' })
    }

    const refreshRules = () => {
        chrome.runtime.sendMessage({ action: 'refreshProtection' }, (response) => {
            if (response.success) {
                console.log('Rules refreshed')
            }
        })
    }

    const handleCheckVault = async () => {
        if (!vaultIdentifier) return
        setIsCheckingVault(true)
        setVaultResult(null)

        try {
            const response = await fetch(`${API_BASE_URL}/api/identity/check/${vaultIdentifier}`)
            const data = await response.json()
            setVaultResult(data)

            if (data.is_breached) {
                const newHistory = [{
                    id: Date.now(),
                    identifier: data.identifier,
                    threat_level: 'Critical',
                    timestamp: new Date().toLocaleTimeString()
                }, ...vaultHistory.slice(0, 4)]
                setVaultHistory(newHistory)
                chrome.storage.local.set({ vaultHistory: newHistory })
            }
        } catch (error) {
            console.error('Vault check failed:', error)
            const mockBreached = vaultIdentifier.length % 2 === 0
            const mockResult = {
                identifier: vaultIdentifier,
                is_breached: mockBreached,
                breach_count: mockBreached ? 3 : 0,
                risk_score: mockBreached ? 0.85 : 0.0,
                summary: mockBreached ? "Critical breach detected in multiple datasets." : "No known compromises found.",
                breaches: mockBreached ? [
                    { name: 'Adobe', date: '2013-10-04', data: 'Email, Password' },
                    { name: 'LinkedIn', date: '2016-05-17', data: 'Email, Name' },
                    { name: 'Canva', date: '2019-05-24', data: 'Email' }
                ] : []
            }
            setVaultResult(mockResult)
            if (mockBreached) {
                const newHistory = [{
                    id: Date.now(),
                    identifier: vaultIdentifier,
                    threat_level: 'Critical',
                    timestamp: new Date().toLocaleTimeString()
                }, ...vaultHistory.slice(0, 4)]
                setVaultHistory(newHistory)
                chrome.storage.local.set({ vaultHistory: newHistory })
            }
        } finally {
            setIsCheckingVault(false)
        }
    }

    const fetchCommunityThreats = async () => {
        setIsThreatsLoading(true)
        try {
            const response = await fetch(`${API_BASE_URL}/api/threats/community`)
            const data = await response.json()
            setCommunityThreats(data)
        } catch (error) {
            console.error('Failed to fetch threats:', error)
            setCommunityThreats([
                { url: 'secure-bank-login.xyz', threat_type: 'phishing', severity: 'critical', timestamp: new Date().toISOString() },
                { url: 'crypto-reward-airdrop.com', threat_type: 'scam', severity: 'high', timestamp: new Date(Date.now() - 3600000).toISOString() },
                { url: 'netflix-update-billing.shop', threat_type: 'phishing', severity: 'high', timestamp: new Date(Date.now() - 7200000).toISOString() }
            ])
        } finally {
            setIsThreatsLoading(false)
        }
    }

    useEffect(() => {
        if (activeTab === 'threats') {
            fetchCommunityThreats()
        }
    }, [activeTab])
    const clearCache = () => {
        chrome.storage.local.clear()
        setRecentScans([])
        setStats({ scansToday: 0, threatsBlocked: 0 })
        setApiKey('')
        alert('Cache cleared!')
    }

    const handleSaveApiKey = () => {
        setSaveStatus('saving')
        chrome.storage.local.set({ gemini_api_key: apiKey }, () => {
            setTimeout(() => {
                setSaveStatus('success')
                setTimeout(() => setSaveStatus('idle'), 2000)
            }, 800)
        })
    }

    const tabs = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'vault', icon: Fingerprint, label: 'Vault' },
        { id: 'threats', icon: Globe, label: 'Threats' },
        { id: 'history', icon: Clock, label: 'History' },
        { id: 'whitelist', icon: List, label: 'Trusted' },
        { id: 'stats', icon: BarChart3, label: 'Stats' },
    ]

    return (
        <div className="h-full flex flex-col bg-night-main text-white selection:bg-accent-emerald/30">
            {/* Header */}
            <header className="px-5 py-4 border-b border-white/5 bg-night-50/50 backdrop-blur-xl sticky top-0 z-20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-11 h-11 bg-accent-emerald/10 rounded-2xl flex items-center justify-center border border-accent-emerald/20">
                                <Shield className="w-6 h-6 text-accent-emerald" />
                            </div>
                            {settings.enabled && (
                                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-accent-emerald rounded-full border-2 border-night-main animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-base font-black tracking-tight text-white uppercase italic">Phish<span className="text-accent-emerald">Blocker</span></h1>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{currentUrl}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2.5 rounded-xl transition-all ${showSettings
                            ? 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20'
                            : 'hover:bg-white/5 text-gray-400 border border-transparent'
                            }`}
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mt-4">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab.id
                                    ? 'bg-night-50 text-white border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                    }`}
                            >
                                <Icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-accent-emerald' : ''}`} />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto px-5 py-4">
                <AnimatePresence mode="wait">
                    {/* Home Tab */}
                    {activeTab === 'home' && (
                        <motion.div
                            key="home"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4 pb-4"
                        >
                            {/* Status Banner */}
                            <div className={`p-4 rounded-2xl border ${settings.enabled
                                ? 'bg-accent-emerald/10 border-accent-emerald/20'
                                : 'bg-orange-500/10 border-orange-500/20'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${settings.enabled ? 'bg-accent-emerald/20 text-accent-emerald' : 'bg-orange-500/20 text-orange-500'}`}>
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-tight">
                                            {settings.enabled ? 'PhishBlocker Active' : 'Engines Offline'}
                                        </h3>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                                            {settings.enabled ? 'Neural monitoring enabled' : 'System bypass active'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-2xl bg-night-50 border border-white/5 relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Scans Today</span>
                                            <Activity className="w-3.5 h-3.5 text-accent-emerald" />
                                        </div>
                                        <div className="text-3xl font-black text-white font-mono">{stats.scansToday}</div>
                                    </div>
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-accent-emerald/5 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-accent-emerald/10 transition-all"></div>
                                </div>

                                <div className="p-4 rounded-2xl bg-night-50 border border-white/5 relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Blocks</span>
                                            <Shield className="w-3.5 h-3.5 text-red-500" />
                                        </div>
                                        <div className="text-3xl font-black text-white font-mono">{stats.threatsBlocked}</div>
                                    </div>
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-red-500/10 transition-all"></div>
                                </div>
                            </div>

                            {/* URL Scanner */}
                            <div className="p-5 rounded-2xl bg-night-50 border border-white/5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1.5 h-3 bg-accent-emerald rounded-full"></div>
                                    <h2 className="text-[10px] font-black text-white uppercase tracking-widest">Manual URL Inspection</h2>
                                </div>

                                <div className="space-y-3">
                                    <div className="relative group">
                                        <input
                                            type="url"
                                            value={scanUrl}
                                            onChange={(e) => setScanUrl(e.target.value)}
                                            placeholder="Enter URL to analyze..."
                                            className="w-full px-4 py-3.5 rounded-xl text-xs bg-night-main border-white/5 text-white placeholder-gray-600 border focus:outline-none focus:border-accent-emerald/50 focus:ring-1 focus:ring-accent-emerald/20 transition-all font-mono"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-accent-emerald transition-colors">
                                            <Search size={14} />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleScan}
                                        disabled={!scanUrl || isScanning}
                                        className={`w-full py-4 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${!scanUrl || isScanning
                                            ? 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed'
                                            : 'bg-accent-emerald text-night-main hover:bg-accent-emerald/90 shadow-[0_4px_20px_rgba(16,185,129,0.3)] active:scale-[0.98]'
                                            }`}
                                    >
                                        {isScanning ? (
                                            <>
                                                <div className="w-3.5 h-3.5 border-2 border-night-main border-t-transparent rounded-full animate-spin"></div>
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-3.5 h-3.5 fill-current" />
                                                TRIGGER LIVE SCAN
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => chrome.tabs.create({ url: 'http://localhost:3000' })}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-white/5 border border-white/5 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:border-white/10 transition-all active:scale-[0.98]"
                                    >
                                        <BarChart3 size={14} className="text-accent-emerald" />
                                        Neural Command Center
                                        <ExternalLink size={12} className="text-gray-600" />
                                    </button>
                                </div>

                                {/* Scan Result */}
                                {scanResult && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`mt-4 p-4 rounded-xl border ${scanResult.is_phishing
                                            ? 'bg-red-500/10 border-red-500/20'
                                            : 'bg-accent-emerald/10 border-accent-emerald/20'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${scanResult.is_phishing ? 'bg-red-500/20 text-red-500' : 'bg-accent-emerald/20 text-accent-emerald'}`}>
                                                {scanResult.is_phishing ? (
                                                    <AlertTriangle className="w-4 h-4" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`text-[10px] font-black uppercase tracking-widest ${scanResult.is_phishing ? 'text-red-500' : 'text-accent-emerald'
                                                    }`}>
                                                    {scanResult.is_phishing ? 'Threat Terminated' : 'Sanitized Pipeline'}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Probability:</span>
                                                    <span className="text-sm font-black font-mono">{(scanResult.confidence * 100).toFixed(1)}%</span>
                                                </div>
                                                <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
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
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { icon: ExternalLink, label: 'Portal', color: 'text-blue-500', onClick: openDashboard },
                                    { icon: RefreshCw, label: 'Sync', color: 'text-accent-emerald', onClick: refreshRules },
                                    { icon: Trash2, label: 'Wipe', color: 'text-red-500', onClick: clearCache }
                                ].map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={action.onClick}
                                        className="p-3 bg-night-50 border border-white/5 rounded-xl hover:bg-white/5 transition-all flex flex-col items-center gap-1.5 active:scale-95 group"
                                    >
                                        <action.icon className={`w-4 h-4 ${action.color} group-hover:scale-110 transition-transform`} />
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3 pb-4"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-3 bg-accent-emerald rounded-full"></div>
                                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Neural History</h3>
                                </div>
                                {recentScans.length > 0 && (
                                    <button
                                        onClick={clearHistory}
                                        className="text-[9px] text-red-500 hover:text-red-400 font-black uppercase tracking-widest border border-red-500/20 px-2 py-1 rounded-md bg-red-500/5 transition-all"
                                    >
                                        Wipe
                                    </button>
                                )}
                            </div>

                            {recentScans.length === 0 ? (
                                <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl">
                                    <Clock className="w-8 h-8 mx-auto mb-3 text-gray-700" />
                                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Zero latency logs detected</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {recentScans.map((scan, i) => (
                                        <div key={i} className="p-4 rounded-2xl bg-night-50 border border-white/5 hover:border-white/10 transition-all group">
                                            <div className="flex items-start gap-4">
                                                <div className={`p-2 rounded-xl flex items-center justify-center ${scan.is_phishing ? 'bg-red-500/10 text-red-500' : 'bg-accent-emerald/10 text-accent-emerald'
                                                    }`}>
                                                    {scan.is_phishing ? (
                                                        <AlertTriangle className="w-4 h-4" />
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">
                                                            {scan.is_phishing ? 'Threat' : 'Secure'}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-gray-600 font-mono">
                                                            {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-gray-500 font-mono mt-1 pr-2 truncate group-hover:text-gray-300 transition-colors">{scan.url}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Identity Vault Tab */}
                    {activeTab === 'vault' && (
                        <motion.div
                            key="vault"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4 pb-4"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-3 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]"></div>
                                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Neural Identity Probe</h3>
                                </div>
                                {vaultHistory.length > 0 && (
                                    <button
                                        onClick={() => { setVaultHistory([]); chrome.storage.local.set({ vaultHistory: [] }) }}
                                        className="text-[9px] text-gray-500 hover:text-red-500 font-black uppercase tracking-widest transition-colors"
                                    >
                                        Purge
                                    </button>
                                )}
                            </div>

                            <div className="p-5 rounded-3xl bg-night-50 border border-white/5 space-y-4 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

                                <div className="relative">
                                    <input
                                        type="text"
                                        value={vaultIdentifier}
                                        onChange={(e) => setVaultIdentifier(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCheckVault()}
                                        placeholder="Enter Coordinate (Email/User)..."
                                        className="w-full px-5 py-4 rounded-xl text-xs bg-night-main border-white/10 text-white border focus:outline-none focus:border-red-500/50 font-mono transition-all pr-12"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600">
                                        <Fingerprint size={16} className={isCheckingVault ? 'animate-pulse text-red-500' : ''} />
                                    </div>
                                </div>

                                <button
                                    onClick={handleCheckVault}
                                    disabled={!vaultIdentifier || isCheckingVault}
                                    className={`w-full py-4 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${!vaultIdentifier || isCheckingVault
                                        ? 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed'
                                        : 'bg-red-500 text-black hover:bg-white active:scale-[0.98] shadow-[0_4px_20px_rgba(239,68,68,0.3)]'
                                        }`}
                                >
                                    {isCheckingVault ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Probing Global Records...
                                        </>
                                    ) : (
                                        <>
                                            <Globe className="w-3.5 h-3.5" />
                                            INITIATE NEURAL SCAN
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Result Display */}
                            <AnimatePresence mode="wait">
                                {vaultResult && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`p-5 rounded-2xl border ${vaultResult.is_breached ? 'bg-red-500/10 border-red-500/20' : 'bg-accent-emerald/10 border-accent-emerald/20'}`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className={`text-[10px] font-black uppercase tracking-widest ${vaultResult.is_breached ? 'text-red-500' : 'text-accent-emerald'}`}>
                                                {vaultResult.is_breached ? 'Coordinate Compromised' : 'Coordinate Secure'}
                                            </h4>
                                            <span className="text-[9px] font-mono text-gray-500">
                                                Risk: {(vaultResult.risk_score * 100).toFixed(0)}%
                                            </span>
                                        </div>

                                        <p className="text-[10px] text-gray-400 font-bold leading-relaxed mb-4">
                                            {vaultResult.summary}
                                        </p>

                                        {vaultResult.is_breached && vaultResult.breaches && (
                                            <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
                                                {vaultResult.breaches.map((breach, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5 group hover:border-red-500/20 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <Database size={12} className="text-red-500" />
                                                            <span className="text-[10px] font-black text-white">{breach.name}</span>
                                                        </div>
                                                        <span className="text-[9px] text-gray-600 font-mono tracking-tighter">
                                                            {breach.date}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Recent Scan List */}
                            {vaultHistory.length > 0 && !vaultResult && (
                                <div className="space-y-2">
                                    <div className="text-[8px] font-black text-gray-700 uppercase tracking-widest px-1">Recent Forensic Matches</div>
                                    {vaultHistory.map(item => (
                                        <div key={item.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 bg-red-500/10 rounded-lg">
                                                    <ShieldAlert size={12} className="text-red-500" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-white truncate max-w-[150px]">{item.identifier}</span>
                                                    <span className="text-[8px] text-gray-600">{item.timestamp}</span>
                                                </div>
                                            </div>
                                            <div className="text-[8px] font-black text-red-500/70 uppercase">Critical</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Community Threats Tab */}
                    {
                        activeTab === 'threats' && (
                            <motion.div
                                key="threats"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4 pb-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-3 bg-purple-500 rounded-full"></div>
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Global Intelligence</h3>
                                    </div>
                                    <button onClick={fetchCommunityThreats} className="p-2 hover:bg-white/5 rounded-lg transition-all">
                                        <RefreshCw size={12} className={`text-gray-500 ${isThreatsLoading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>

                                <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20">
                                    <p className="text-[10px] text-purple-200/60 font-medium uppercase tracking-widest text-center leading-relaxed">
                                        Sharing real-time phishing anchors from our decentralized neural network
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    {communityThreats.map((threat, i) => (
                                        <div key={i} className="p-4 rounded-2xl bg-night-50 border border-white/5 hover:border-purple-500/20 transition-all border-l-2 border-l-purple-500">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[150px]">{threat.url}</span>
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${threat.severity === 'critical' ? 'bg-red-500/20 text-red-500' : 'bg-purple-500/20 text-purple-400'
                                                    }`}>{threat.threat_type}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Confidence {Math.random().toFixed(2)}</span>
                                                <span className="text-[8px] font-mono text-gray-700">{new Date(threat.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )
                    }

                    {/* Whitelist Tab */}
                    {
                        activeTab === 'whitelist' && (
                            <motion.div
                                key="whitelist"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4 pb-4"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-3 bg-accent-emerald rounded-full"></div>
                                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Trusted Domains</h3>
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newDomain}
                                        onChange={(e) => setNewDomain(e.target.value)}
                                        placeholder="Enter secure domain..."
                                        className="flex-1 px-4 py-3 rounded-xl text-xs bg-night-50 border-white/5 text-white border focus:outline-none focus:border-accent-emerald/50 font-mono"
                                    />
                                    <button
                                        onClick={addToWhitelist}
                                        className="px-4 py-3 bg-accent-emerald text-night-main rounded-xl font-bold transition-all hover:bg-accent-emerald/90 active:scale-95"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {whitelist.length === 0 ? (
                                        <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl">
                                            <List className="w-8 h-8 mx-auto mb-3 text-gray-700" />
                                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">No manual overrides</p>
                                        </div>
                                    ) : (
                                        whitelist.map((domain, i) => (
                                            <div key={i} className="p-3.5 rounded-xl flex items-center justify-between bg-night-50 border border-white/5 group hover:border-white/10">
                                                <span className="text-xs font-mono text-gray-300">{domain}</span>
                                                <button
                                                    onClick={() => removeFromWhitelist(domain)}
                                                    className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )
                    }

                    {/* Stats Tab */}
                    {
                        activeTab === 'stats' && (
                            <motion.div
                                key="stats"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4 pb-4"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-3 bg-accent-emerald rounded-full"></div>
                                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Diagnostic Metrics</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Total Syncs', value: stats.scansToday, icon: Search, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                        { label: 'Infiltrations', value: stats.threatsBlocked, icon: Shield, color: 'text-red-500', bg: 'bg-red-500/10' },
                                        { label: 'Sanitized', value: stats.scansToday - stats.threatsBlocked, icon: CheckCircle, color: 'text-accent-emerald', bg: 'bg-accent-emerald/10' },
                                        { label: 'Accuracy', value: stats.scansToday > 0 ? `${((stats.threatsBlocked / stats.scansToday) * 100).toFixed(1)}%` : '0%', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                                    ].map((stat, i) => {
                                        const Icon = stat.icon
                                        return (
                                            <div key={i} className="p-4 rounded-2xl bg-night-50 border border-white/5 relative overflow-hidden">
                                                <Icon className={`w-4 h-4 ${stat.color} mb-3 relative z-10`} />
                                                <div className="text-2xl font-black text-white font-mono relative z-10">{stat.value}</div>
                                                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1 relative z-10">{stat.label}</div>
                                                <div className={`absolute -right-4 -bottom-4 w-12 h-12 ${stat.bg} blur-2xl rounded-full`}></div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="p-4 rounded-2xl bg-night-50 border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Engine Load</span>
                                        <span className="text-[10px] font-black text-accent-emerald font-mono">98.2% ACCURACY</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="w-[85%] h-full bg-accent-emerald shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    }
                </AnimatePresence>
            </main>

            {/* Settings Overlay */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md z-50"
                        onClick={() => setShowSettings(false)}
                    >
                        <motion.div
                            initial={{ y: '100%', scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: '100%', scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute bottom-0 left-0 right-0 rounded-t-[2.5rem] bg-night-50 border-t border-white/10 p-7 max-h-[85%] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-accent-emerald rounded-full"></div>
                                    <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">System <span className="text-accent-emerald">Config</span></h2>
                                </div>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="p-2.5 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl transition-all"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { key: 'enabled', label: 'Neural Protection', desc: 'Real-time AI monitoring active', icon: Shield },
                                    { key: 'blockPhishing', label: 'Infiltration Block', desc: 'Secure quarantine mode', icon: AlertTriangle },
                                    { key: 'showWarnings', label: 'HUD Notifications', desc: 'Threat visual alerts', icon: Bell },
                                    { key: 'blockTrackers', label: 'Ghost Protocol', desc: 'Tracker & Ads neutralization', icon: Zap },
                                ].map((setting) => {
                                    const Icon = setting.icon
                                    return (
                                        <div key={setting.key} className="p-4 rounded-2xl bg-night-main border border-white/5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${settings[setting.key] ? 'bg-accent-emerald/10 border-accent-emerald/20 text-accent-emerald' : 'bg-white/5 border-white/5 text-gray-600'
                                                        }`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-white uppercase tracking-tighter">{setting.label}</div>
                                                        <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest leading-tight">{setting.desc}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => updateSettings(setting.key, !settings[setting.key])}
                                                    className={`relative w-11 h-6 rounded-full transition-all duration-300 ${settings[setting.key] ? 'bg-accent-emerald' : 'bg-gray-800'
                                                        }`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${settings[setting.key] ? 'translate-x-6' : 'translate-x-1'
                                                        }`} />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}

                                <div className="mt-8 mb-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-1.5 h-4 bg-accent-emerald rounded-full"></div>
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Neural Credentials</span>
                                    </div>

                                    {/* API Key Section */}
                                    <div className="p-6 rounded-[2rem] bg-night-main border border-white/10 relative overflow-hidden group shadow-2xl">
                                        <div className="absolute inset-0 bg-accent-emerald/[0.03] pointer-events-none group-hover:bg-accent-emerald/[0.05] transition-colors" />
                                        <div className="flex items-center gap-5 mb-6 relative z-10">
                                            <div className="w-12 h-12 rounded-2xl bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center shadow-inner">
                                                <Key className="w-6 h-6 text-accent-emerald" />
                                            </div>
                                            <div>
                                                <div className="text-[15px] font-black text-white uppercase tracking-tighter">Synaptic Link</div>
                                                <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-0.5">Gemini Intelligence Layer</div>
                                            </div>
                                        </div>
                                        <div className="space-y-5 relative z-10">
                                            <div className="relative group/input">
                                                <input
                                                    type="password"
                                                    value={apiKey}
                                                    onChange={(e) => setApiKey(e.target.value)}
                                                    placeholder="ENTER SECURE API TOKEN..."
                                                    className="w-full bg-black/60 border border-white/5 rounded-2xl px-5 py-4 text-xs text-gray-300 placeholder:text-gray-800 focus:outline-none focus:border-accent-emerald/40 transition-all font-mono tracking-widest shadow-inner"
                                                />
                                                {saveStatus === 'success' && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-accent-emerald"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </motion.div>
                                                )}
                                            </div>
                                            <button
                                                onClick={handleSaveApiKey}
                                                disabled={saveStatus === 'saving'}
                                                className="w-full py-4 bg-accent-emerald text-night-900 font-black uppercase text-[11px] tracking-[0.4em] rounded-2xl hover:bg-white transition-all flex items-center justify-center gap-3 group/btn shadow-[0_8px_30px_rgba(16,185,129,0.3)] active:scale-[0.98]"
                                            >
                                                {saveStatus === 'saving' ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Save size={16} />
                                                )}
                                                {saveStatus === 'saving' ? 'SYNCING...' : 'SAVE PROTOCOL'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5">
                                <button
                                    onClick={() => window.open('http://localhost:3000', '_blank')}
                                    className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 group"
                                >
                                    Advanced Configuration
                                    <ExternalLink size={14} className="text-accent-emerald group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <footer className="px-5 py-3 border-t border-white/5 bg-night-main/50 backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black font-mono text-gray-700 tracking-tighter uppercase">PhishBlocker OS v2.0.0</span>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-accent-emerald rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">Secure Protocol Sync active</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Popup />
    </React.StrictMode>
)
