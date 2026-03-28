import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'd3': ['d3'],
          'i18n': ['i18next', 'react-i18next'],
          'leaflet': ['leaflet', 'leaflet.markercluster'],
          'framer': ['framer-motion'],
        }
      }
    }
  }
})
