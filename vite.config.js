import { defineConfig } from 'vite'
import { resolve } from 'path';

import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        a: './src/main.js',
        b: './src/danmuku-main.js',
      }
    }
  },
  plugins: [vue()],
})
