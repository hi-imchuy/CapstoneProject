const fs = require('fs')
const path = require('path')

const distDir = path.resolve(__dirname, '..', 'dist')
const indexHtml = path.join(distDir, 'index.html')

const fallbackRoutes = [
  'forgot-password',
  'login',
  'register'
]

if (!fs.existsSync(indexHtml)) {
  throw new Error('dist/index.html was not found. Run this script after vite build.')
}

for (const route of fallbackRoutes) {
  const routeDir = path.join(distDir, route)
  fs.mkdirSync(routeDir, { recursive: true })
  fs.copyFileSync(indexHtml, path.join(routeDir, 'index.html'))
}
