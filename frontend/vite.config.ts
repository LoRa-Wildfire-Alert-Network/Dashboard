import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
<<<<<<< HEAD
=======
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'lora-gs.derekrgreene.com',
    ],
    proxy: {
      '/api/live': {
        target: 'http://192.168.1.100:5500',
        changeOrigin: true,
      },
    },
  },
>>>>>>> 9a3597e (updated vite server config for production/demo)
})
