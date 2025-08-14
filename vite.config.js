import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'), // agar bisa pakai @/
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/images': 'http://127.0.0.1:8000',
            '/api': 'http://127.0.0.1:8000',
            '/sanctum': 'http://127.0.0.1:8000',
        }
    },
})
