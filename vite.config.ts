import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/app/',
  plugins: [
    react(),
    {
      name: 'serve-static-landing-in-dev',
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (request.url === '/') {
            response.statusCode = 302
            response.setHeader('Location', '/landing/')
            response.end()
            return
          }

          next()
        })

        server.middlewares.use('/landing', (request, response, next) => {
          const fileName = request.url === '/' || request.url === '/index.html'
            ? 'index.html'
            : request.url === '/landing.css'
              ? 'landing.css'
              : null

          if (!fileName) {
            next()
            return
          }

          const landingPath = path.resolve(__dirname, 'public/landing', fileName)
          response.setHeader('Content-Type', fileName.endsWith('.css') ? 'text/css' : 'text/html')
          response.end(fs.readFileSync(landingPath))
        })
      },
    },
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
