import { useState, useEffect } from 'react'
import {
    AlertTriangle,
    ArrowLeft,
    Shield,
    XCircle,
    Flag,
    Info,
    ChevronRight,
    Lock,
    Eye,
    Zap,
    Activity,
    ShieldAlert,
    ShieldCheck,
    RefreshCw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function WarningPage() {
    const [urlData, setUrlData] = useState(null)
    const [blockedUrl, setBlockedUrl] = useState('')
    const [showDetails, setShowDetails] = useState(false)
    const [domain, setDomain] = useState('')
    const [reportStatus, setReportStatus] = useState('idle') // idle, reporting, reported

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const url = params.get('url')
        setBlockedUrl(url || '')
        if (url) {
            try {
                setDomain(new URL(url).hostname)
            } catch (e) {
                setDomain(url)
            }
        }

        chrome.storage.local.get(['lastScanResult'], (result) => {
            if (result.lastScanResult) {
                setUrlData(result.lastScanResult)
            }
        })
    }, [])

    const goBack = () => {
        // If we have history, try to go back 2 steps to skip the redirect source
        if (window.history.length > 2) {
            window.history.go(-2)
            // Fallback if still on warning page after a moment
            setTimeout(() => {
                if (window.location.pathname.includes('warning.html')) {
                    window.location.href = 'about:newtab'
                }
            }, 500)
        } else {
            window.history.back()
        }
    }

    const proceedAnyway = () => {
        if (blockedUrl) {
            // Normalize before storing
            const normalizedUrl = blockedUrl.replace(/\/$/, '')
            chrome.storage.local.set({ tempBypass: normalizedUrl }, () => {
                // Flash success state before redirecting
                setReportStatus('reported')
                setTimeout(() => {
                    window.location.href = blockedUrl
                }, 300)
            })
        }
    }

    const reportFalsePositive = () => {
        setReportStatus('reporting')
        chrome.runtime.sendMessage({
            action: 'reportFalsePositive',
            url: blockedUrl,
            metadata: urlData
        }, (response) => {
            if (response?.success) {
                setReportStatus('reported')
            } else {
                setReportStatus('idle')
            }
        })
    }

    const shareThreat = () => {
        setReportStatus('sharing')
        chrome.runtime.sendMessage({
            action: 'shareThreat',
            url: blockedUrl,
            metadata: urlData
        }, (response) => {
            if (response?.success) {
                setReportStatus('shared')
            } else {
                setReportStatus('idle')
            }
        })
    }

    return (
        <div className="min-h-screen bg-night-400 text-gray-200 flex items-center justify-center p-6 font-sans selection:bg-accent-emerald/30 overflow-hidden relative">
            {/* Background Architecture */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-accent-emerald/5 blur-[150px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/5 blur-[120px] rounded-full"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full z-10"
            >
                {/* Status Indicator */}
                <div className="flex flex-col items-center mb-12">
                    <motion.div
                        animate={{
                            scale: [1, 1.05, 1],
                            boxShadow: [
                                "0 0 20px rgba(16, 185, 129, 0.1)",
                                "0 0 40px rgba(16, 185, 129, 0.3)",
                                "0 0 20px rgba(16, 185, 129, 0.1)"
                            ]
                        }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="w-24 h-24 bg-night-50 rounded-[2.5rem] border border-accent-emerald/30 flex items-center justify-center mb-8 relative group"
                    >
                        <ShieldAlert className="w-12 h-12 text-accent-emerald" />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-4 border-night-400 animate-pulse shadow-lg shadow-red-500/50"></div>
                    </motion.div>

                    <div className="text-center">
                        <div className="text-[10px] font-black text-accent-emerald uppercase tracking-[0.4em] mb-3">NEURAL DEFENSE MATRIX</div>
                        <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                            Vector Blocked
                        </h1>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">PhishBlocker Final Build Protections Active</p>
                    </div>
                </div>

                {/* Main Warning Hub */}
                <div className="bg-night-300 border border-white/5 rounded-[48px] p-12 shadow-3xl backdrop-blur-3xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-emerald/50 to-transparent"></div>

                    <div className="space-y-10">
                        {/* Host Identification */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Suspicious Target</p>
                                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Live Threat</span>
                                </div>
                            </div>

                            <div className="bg-night-50 border border-white/10 rounded-3xl p-6 flex items-center gap-6 group/target transition-all hover:bg-white/[0.03] hover:border-white/20">
                                <div className="p-4 bg-night-400 rounded-2xl text-accent-emerald border border-white/5 shadow-inner">
                                    <Lock size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-white truncate mb-1 uppercase tracking-tight">{domain}</p>
                                    <p className="text-[10px] text-gray-500 font-bold truncate opacity-60 uppercase tracking-widest">{blockedUrl}</p>
                                </div>
                            </div>
                        </div>

                        {/* Forensic Diagnostics */}
                        <div className="bg-night-50 border border-white/5 rounded-[32px] p-8 overflow-hidden relative">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                                        <Zap size={18} className="text-accent-emerald" />
                                        Forensic Log
                                    </h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Neural Cluster ID: {urlData?.scan_id || 'PB-SYNC-CORE'}</p>
                                </div>
                                <div className="px-5 py-2.5 bg-accent-emerald text-night-400 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                                    Confidence: {urlData ? (urlData.confidence * 100).toFixed(0) : 0}%
                                </div>
                            </div>

                            <p className="text-xs text-gray-400 leading-relaxed font-medium uppercase mb-8">
                                {urlData?.llm_analysis?.threat_assessment ||
                                    `PhishBlocker detected high-risk lexical fingerprints using ${urlData?.method === 'local_wasm' ? 'Wasm Local Inference' : 'Cloud Ensemble Neural Clusters'}.`}
                            </p>

                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/5 text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-[0.2em] rounded-2xl transition-all"
                            >
                                {showDetails ? 'Conceal Forensic Data' : 'Detailed Diagnostics'}
                                <ChevronRight size={14} className={`transition-transform duration-500 ${showDetails ? 'rotate-90' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {showDetails && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-8 grid grid-cols-1 gap-4">
                                            {(urlData?.risk_factors || ['Unverified domain reputation', 'Suspicious URL geometry']).map((factor, i) => (
                                                <div key={i} className="flex items-center gap-4 bg-night-400/50 p-4 rounded-2xl border border-white/5">
                                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{factor}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Critical Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <button
                                onClick={goBack}
                                className="py-5 bg-white text-night-400 font-black rounded-3xl transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-4 text-xs uppercase tracking-[0.2em]"
                            >
                                <ArrowLeft size={20} />
                                Safe Return
                            </button>
                            <button
                                onClick={shareThreat}
                                disabled={reportStatus === 'sharing' || reportStatus === 'shared'}
                                className={`py-5 border-2 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 shadow-xl active:scale-[0.98] ${reportStatus === 'shared'
                                    ? 'bg-blue-500/20 border-blue-500 text-blue-500'
                                    : 'bg-accent-emerald/10 border-accent-emerald/30 text-accent-emerald hover:bg-accent-emerald/20 hover:border-accent-emerald'
                                    }`}
                            >
                                {reportStatus === 'sharing' ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : reportStatus === 'shared' ? (
                                    <>
                                        <Activity size={20} />
                                        Neural Sync Active
                                    </>
                                ) : (
                                    <>
                                        <Zap size={20} />
                                        Share with Community
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={reportFalsePositive}
                                disabled={reportStatus !== 'idle'}
                                className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all ${reportStatus === 'reported' ? 'text-accent-emerald' : 'text-gray-600 hover:text-gray-400'}`}
                            >
                                {reportStatus === 'reported' ? <ShieldCheck size={14} /> : <Flag size={14} />}
                                {reportStatus === 'reported' ? 'False Positive Reported' : 'Report False Positive'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Lower Hub */}
                <div className="mt-12 flex flex-col items-center gap-8">
                    <div className="flex items-center gap-12 opacity-30">
                        <div className="flex items-center gap-3">
                            <Activity size={16} className="text-accent-emerald" />
                            <span className="text-[9px] font-black uppercase tracking-[0.25em]">Neural Sync</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Lock size={16} className="text-accent-emerald" />
                            <span className="text-[9px] font-black uppercase tracking-[0.25em]">AES-256 Node</span>
                        </div>
                    </div>

                    <button
                        onClick={proceedAnyway}
                        className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600 hover:text-red-500 transition-all hover:tracking-[0.5em]"
                    >
                        Force System Bypass
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
