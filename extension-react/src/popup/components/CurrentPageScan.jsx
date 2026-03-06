import { useState, useEffect } from 'react'
import { Search, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function CurrentPageScan() {
    const [currentUrl, setCurrentUrl] = useState('')
    const [scanning, setScanning] = useState(false)
    const [result, setResult] = useState(null)

    useEffect(() => {
        // Get current tab URL
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.url) {
                setCurrentUrl(tabs[0].url)
            }
        })
    }, [])

    const scanCurrentPage = async () => {
        setScanning(true)
        setResult(null)

        try {
            // Send message to background script to scan URL
            chrome.runtime.sendMessage(
                { action: 'scanUrl', url: currentUrl },
                (response) => {
                    setResult(response)
                    setScanning(false)
                }
            )
        } catch (error) {
            console.error('Scan error:', error)
            setScanning(false)
        }
    }

    const getThreatColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'low':
                return 'text-success-600 bg-success-50'
            case 'medium':
                return 'text-warning-600 bg-warning-50'
            case 'high':
                return 'text-danger-600 bg-danger-50'
            default:
                return 'text-gray-600 bg-gray-50'
        }
    }

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Current Page</h2>

            <div className="p-3 bg-gray-100 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">URL</p>
                <p className="text-sm text-gray-900 break-all">{currentUrl || 'Loading...'}</p>
            </div>

            <button
                onClick={scanCurrentPage}
                disabled={scanning || !currentUrl}
                className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
                {scanning ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Scanning...
                    </>
                ) : (
                    <>
                        <Search className="w-5 h-5" />
                        Scan This Page
                    </>
                )}
            </button>

            {result && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg ${result.is_phishing
                            ? 'bg-danger-50 border border-danger-200'
                            : 'bg-success-50 border border-success-200'
                        }`}
                >
                    <div className="flex items-start gap-3">
                        {result.is_phishing ? (
                            <AlertTriangle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
                        ) : (
                            <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                            <h3 className={`font-bold ${result.is_phishing ? 'text-danger-900' : 'text-success-900'}`}>
                                {result.is_phishing ? 'Threat Detected!' : 'Page is Safe'}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Threat Level: <span className={`font-medium ${getThreatColor(result.threat_level)} px-2 py-0.5 rounded`}>
                                    {result.threat_level}
                                </span>
                            </p>
                            <div className="mt-2">
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Confidence</span>
                                    <span>{(result.confidence * 100).toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full ${result.is_phishing ? 'bg-danger-500' : 'bg-success-500'
                                            }`}
                                        style={{ width: `${result.confidence * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
