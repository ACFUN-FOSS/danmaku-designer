
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

import path from 'path'
/*import { dirname } from 'node:path'
const __dirname = dirname(fileURLToPath(import.meta.url))*/
// https://vite.dev/config/
export default defineConfig(({mode}) => {
  return {
    plugins: [
      vue(),
      vueJsx(),
      vueDevTools()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
    }
  }
})
