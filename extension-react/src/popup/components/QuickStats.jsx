import { useState, useEffect } from 'react'
import { TrendingUp, Shield, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

export default function QuickStats() {
    const [stats, setStats] = useState({
        scansToday: 0,
        threatsBlocked: 0,
        lastScan: null,
    })

    useEffect(() => {
        // Load stats from chrome.storage
        chrome.storage.local.get(['stats'], (result) => {
            if (result.stats) {
                setStats(result.stats)
            }
        })
    }, [])

    const statCards = [
        {
            icon: TrendingUp,
            label: 'Scans Today',
            value: stats.scansToday,
            color: 'from-blue-500 to-blue-600',
        },
        {
            icon: Shield,
            label: 'Threats Blocked',
            value: stats.threatsBlocked,
            color: 'from-red-500 to-red-600',
        },
        {
            icon: Clock,
            label: 'Last Scan',
            value: stats.lastScan
                ? new Date(stats.lastScan).toLocaleTimeString()
                : 'Never',
            color: 'from-purple-500 to-purple-600',
        },
    ]

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Statistics</h2>

            <div className="grid grid-cols-1 gap-4">
                {statCards.map((card, index) => {
                    const Icon = card.icon
                    return (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-4 rounded-xl bg-gradient-to-r ${card.color} text-white shadow-lg`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-90">{card.label}</p>
                                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                                </div>
                                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <Icon className="w-6 h-6" />
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-gray-900 mb-2">Protection Summary</h3>
                <p className="text-sm text-gray-700">
                    PhishBlocker has been actively protecting your browsing experience.
                    Keep protection enabled for continuous security.
                </p>
            </div>
        </div>
    )
}
