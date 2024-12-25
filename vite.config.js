import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath,URL } from 'url';
import { createHtmlPlugin } from 'vite-plugin-html';

import vue from '@vitejs/plugin-vue'
import projectConfig from './projectConfig.js';
const projectName = process.env.PROJECT_NAME;

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      "@": resolve(__dirname,'src')
    },
    extensions: ['.js', '.ts', '.vue', '.json'],
  },
  build: {
    outDir: `dist-${projectName}`,
    rollupOptions: {
      input: {
        main: 'index.html',
        desinger: 'designer.html',
        danmuku: 'danmuku.html',
      },
      output: {
        compact: true,
        /*entryFileName: 'assets/js/[name]-[hash].js',
        chunkFileName: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/js/[ext]/[name].[ext]'*/
      }
    }
  },
  plugins: [
      vue(),
      createHtmlPlugin(projectConfig[projectName])
  ],
})
