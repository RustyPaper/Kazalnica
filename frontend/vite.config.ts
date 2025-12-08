import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  publicDir: 'public', // ✅ DODANE - Vite będzie kopiować pliki z public/ do dist/
  build: {
    outDir: 'dist',    // ✅ DODANE - folder wyjściowy
  },
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
    }
  }
})
