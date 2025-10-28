import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  // Use root path for Capacitor builds, subdirectory for GitHub Pages
  base: process.env.CAPACITOR ? '/' : '/bluetoothWebApp/',
})
