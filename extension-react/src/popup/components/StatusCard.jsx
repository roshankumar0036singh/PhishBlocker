import { CheckCircle, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function StatusCard({ enabled }) {
    return (
        <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className={`p-4 rounded-xl mb-4 ${enabled
                    ? 'bg-gradient-to-r from-success-500 to-success-600'
                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                } text-white shadow-lg`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        {enabled ? (
                            <CheckCircle className="w-5 h-5" />
                        ) : (
                            <XCircle className="w-5 h-5" />
                        )}
                        <h3 className="font-bold text-lg">
                            {enabled ? 'Protection Enabled' : 'Protection Disabled'}
                        </h3>
                    </div>
                    <p className="text-sm opacity-90">
                        {enabled
                            ? 'Actively monitoring for threats'
                            : 'Click settings to enable protection'}
                    </p>
                </div>
                {enabled && (
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-3 h-3 bg-white rounded-full"
                    />
                )}
            </div>
        </motion.div>
    )
}
