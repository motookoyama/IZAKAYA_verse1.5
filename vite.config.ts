import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Cast plugin to any to avoid cross-workspace type mismatch warnings
  plugins: [vue() as any],
  // GitHub Pages serves this repo under /IZAKAYA_verse1.5/
  base: command === 'build' ? '/IZAKAYA_verse1.5/' : '/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
}))
