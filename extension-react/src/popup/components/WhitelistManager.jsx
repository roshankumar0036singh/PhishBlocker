import { useState, useEffect } from 'react'
import { Plus, X, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function WhitelistManager() {
    const [whitelist, setWhitelist] = useState([])
    const [newDomain, setNewDomain] = useState('')
    const [showAdd, setShowAdd] = useState(false)

    useEffect(() => {
        // Load whitelist from chrome.storage
        chrome.storage.sync.get(['whitelist'], (result) => {
            if (result.whitelist) {
                setWhitelist(result.whitelist)
            }
        })
    }, [])

    const addDomain = () => {
        if (!newDomain.trim()) return

        const domain = newDomain.trim().toLowerCase()
        if (!whitelist.includes(domain)) {
            const updated = [...whitelist, domain]
            setWhitelist(updated)
            chrome.storage.sync.set({ whitelist: updated })
        }

        setNewDomain('')
        setShowAdd(false)
    }

    const removeDomain = (domain) => {
        const updated = whitelist.filter(d => d !== domain)
        setWhitelist(updated)
        chrome.storage.sync.set({ whitelist: updated })
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Trusted Sites
                </h2>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="p-1.5 rounded-lg bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors"
                >
                    {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
            </div>

            <AnimatePresence>
                {showAdd && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newDomain}
                                onChange={(e) => setNewDomain(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addDomain()}
                                placeholder="example.com"
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                            <button
                                onClick={addDomain}
                                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                            >
                                Add
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {whitelist.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                    <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No trusted sites yet</p>
                    <p className="text-xs mt-1">Add sites you always trust</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {whitelist.map((domain) => (
                        <motion.div
                            key={domain}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg"
                        >
                            <span className="text-sm text-gray-900">{domain}</span>
                            <button
                                onClick={() => removeDomain(domain)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
