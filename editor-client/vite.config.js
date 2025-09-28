import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",   // default, but explicit
  },
  server: {
    port: 5173        // dev server port
  },
  base: "/"          // ensures correct asset resolution
})
