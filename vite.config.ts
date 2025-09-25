import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: '_redirects',
          dest: '.'
        }
      ]
    })
  ],
  resolve: { extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx"] },
  optimizeDeps: { include: ["pdfmake/build/pdfmake.js", "pdfmake/build/vfs_fonts.js"], exclude: ['lucide-react'] },
})
