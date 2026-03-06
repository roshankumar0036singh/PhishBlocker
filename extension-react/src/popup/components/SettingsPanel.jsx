import { Shield, Bell, Ban } from 'lucide-react'

export default function SettingsPanel({ settings, onUpdate }) {
    const toggleSetting = (key) => {
        onUpdate({ ...settings, [key]: !settings[key] })
    }

    const settingsOptions = [
        {
            key: 'enabled',
            icon: Shield,
            title: 'Enable Protection',
            description: 'Turn on real-time phishing detection',
        },
        {
            key: 'blockPhishing',
            icon: Ban,
            title: 'Block Phishing Sites',
            description: 'Automatically block detected threats',
        },
        {
            key: 'showWarnings',
            icon: Bell,
            title: 'Show Warnings',
            description: 'Display warning notifications',
        },
    ]

    return (
        <div className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Settings</h2>

            {settingsOptions.map((option) => {
                const Icon = option.icon
                const isEnabled = settings[option.key]

                return (
                    <div
                        key={option.key}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${isEnabled ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-500'
                                }`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{option.title}</h3>
                                <p className="text-sm text-gray-600 mt-0.5">{option.description}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => toggleSetting(option.key)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? 'bg-primary-600' : 'bg-gray-300'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                )
            })}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                    <strong>Tip:</strong> Keep all protections enabled for maximum security.
                </p>
            </div>
        </div>
    )
}
