import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    strictPort: false,

    allowedHosts: [
      '.ts.net',
      'localhost'
    ],

    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    },
    
    // DODANE: Obsługa History API dla routingu Vue
    historyApiFallback: true
  }
})
