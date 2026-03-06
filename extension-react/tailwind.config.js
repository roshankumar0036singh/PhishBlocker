/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/**/*.{js,jsx,html}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    500: '#10b981',
                    600: '#059669',
                    700: '#047857',
                },
                night: {
                    50: '#121212',
                    100: '#0f0f0f',
                    200: '#0a0a0a',
                    300: '#080808',
                    400: '#050505',
                    500: '#030303',
                },
                accent: {
                    emerald: '#10b981',
                    'emerald-glow': 'rgba(16, 185, 129, 0.2)',
                },
                success: {
                    500: '#10b981',
                    600: '#059669',
                },
                warning: {
                    500: '#f59e0b',
                    600: '#d97706',
                },
                danger: {
                    500: '#ef4444',
                    600: '#dc2626',
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'night-gradient': 'linear-gradient(to bottom right, #0a0a0a, #050505)',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(16, 185, 129, 0.2)' },
                    '100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)' },
                }
            }
        },
    },
    plugins: [],
}
