import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const DOCS_PORT = process.env.DOCS_PORT || 4000

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/docs': {
        target: `http://localhost:${DOCS_PORT}`,
        changeOrigin: true,
        rewrite: (path) => (path === '/docs' ? '/docs/' : path),
      },
    },
  },
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
  ],
})
