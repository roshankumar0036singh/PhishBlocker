import { useState, useEffect } from 'react'
import { History, AlertTriangle, CheckCircle, Clock, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function RecentScansHistory() {
    const [scans, setScans] = useState([])

    useEffect(() => {
        // Load recent scans from chrome.storage
        chrome.storage.local.get(['recentScans'], (result) => {
            if (result.recentScans) {
                setScans(result.recentScans.slice(0, 5)) // Show last 5 scans
            }
        })

        // Listen for new scans
        const handleStorageChange = (changes) => {
            if (changes.recentScans) {
                setScans(changes.recentScans.newValue?.slice(0, 5) || [])
            }
        }

        chrome.storage.onChanged.addListener(handleStorageChange)
        return () => chrome.storage.onChanged.removeListener(handleStorageChange)
    }, [])

    const clearHistory = () => {
        chrome.storage.local.set({ recentScans: [] })
        setScans([])
    }

    const formatTime = (timestamp) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diff = Math.floor((now - date) / 1000)

        if (diff < 60) return `${diff}s ago`
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
        return date.toLocaleDateString()
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Recent Scans
                </h2>
                {scans.length > 0 && (
                    <button
                        onClick={clearHistory}
                        className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
                    >
                        <Trash2 className="w-3 h-3" />
                        Clear
                    </button>
                )}
            </div>

            {scans.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No recent scans</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <AnimatePresence>
                        {scans.map((scan, index) => (
                            <motion.div
                                key={scan.timestamp}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.05 }}
                                className={`p-3 rounded-lg border ${scan.is_phishing
                                        ? 'bg-red-50 border-red-200'
                                        : 'bg-green-50 border-green-200'
                                    }`}
                            >
                                <div className="flex items-start gap-2">
                                    {scan.is_phishing ? (
                                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-900 truncate">
                                            {new URL(scan.url).hostname}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-xs px-2 py-0.5 rounded ${scan.is_phishing
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-green-100 text-green-700'
                                                }`}>
                                                {scan.threat_level}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatTime(scan.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
