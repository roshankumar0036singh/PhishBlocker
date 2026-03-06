import { ExternalLink, RefreshCw, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function QuickActions() {
    const openDashboard = () => {
        chrome.tabs.create({ url: 'http://localhost:3000' })
    }

    const clearCache = async () => {
        await chrome.storage.local.clear()
        alert('Cache cleared successfully!')
    }

    const refreshProtection = () => {
        chrome.runtime.sendMessage({ action: 'refreshProtection' })
        alert('Protection rules refreshed!')
    }

    const actions = [
        {
            icon: ExternalLink,
            label: 'Open Dashboard',
            onClick: openDashboard,
            color: 'from-blue-500 to-blue-600',
        },
        {
            icon: RefreshCw,
            label: 'Refresh Rules',
            onClick: refreshProtection,
            color: 'from-green-500 to-green-600',
        },
        {
            icon: Trash2,
            label: 'Clear Cache',
            onClick: clearCache,
            color: 'from-red-500 to-red-600',
        },
    ]

    return (
        <div className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>

            <div className="grid grid-cols-3 gap-2">
                {actions.map((action, index) => {
                    const Icon = action.icon
                    return (
                        <motion.button
                            key={action.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={action.onClick}
                            className={`p-3 rounded-lg bg-gradient-to-br ${action.color} text-white shadow-lg hover:shadow-xl transition-shadow`}
                        >
                            <Icon className="w-5 h-5 mx-auto mb-1" />
                            <p className="text-xs font-medium">{action.label}</p>
                        </motion.button>
                    )
                })}
            </div>
        </div>
    )
}
