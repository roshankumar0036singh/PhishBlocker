import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import manifest from './manifest.json'

export default defineConfig({
    plugins: [
        react(),
        crx({ manifest }),
        viteStaticCopy({
            targets: [
                {
                    src: 'node_modules/onnxruntime-web/dist/*.wasm',
                    dest: '.'
                }
            ]
        })
    ],
    build: {
        emptyOutDir: true,
        rollupOptions: {
            input: {
                popup: 'src/popup/popup.html',
                warning: 'src/warning/warning.html',
                sidepanel: 'src/sidepanel/sidepanel.html',
            },
        },
    },
})
