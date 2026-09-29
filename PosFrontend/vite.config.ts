import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy de desarrollo: redirige /api/* al backend local (perfil "http" de launchSettings.json)
    proxy: {
      '/api': {
        target: 'http://localhost:5236',
        changeOrigin: true,
      },
    },
  },
})
