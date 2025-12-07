import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,          // udostępnia serwer na 0.0.0.0
    port: 5173,          // jeden wspólny port
    strictPort: false,   // jeśli 5173 zajęty, użyje kolejnego

    allowedHosts: [
      '.ts.net',         // Tailscale Funnel
      'localhost'
    ],

    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Twój backend
        changeOrigin: true,
      }
    }
  }
})

