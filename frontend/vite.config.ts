import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const DOCS_PORT = process.env.DOCS_PORT || 4000
// in PROD mode, serve /docs from dist/docs/ (no proxy)
const isPreview = process.env.VITE_PREVIEW === '1'

// https://vite.dev/config/
export default defineConfig({
  preview: {
    allowedHosts: ['.derekrgreene.com', 'localhost', '127.0.0.1'],
  },
  server: {
    proxy: isPreview
      ? undefined
      : {
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
