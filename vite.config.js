import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 8080,
    open: true,
    proxy: {
      '/api': {
        target: 'https://192.168.5.253:10000',
        changeOrigin: true,
        secure: false // Allow self-signed certificates
      },
      '/ws': {
        target: 'wss://192.168.5.253:10000',
        ws: true,
        changeOrigin: true,
        secure: false // Allow self-signed certificates
      }
    }
  }
}) 