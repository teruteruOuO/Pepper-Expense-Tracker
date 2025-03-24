import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import dotenv from 'dotenv';
import removeConsole from 'vite-plugin-remove-console'


dotenv.config();

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    removeConsole()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: parseInt(process.env.VITE_FRONTEND_PORT), // Change to your desired port
    host: process.env.VITE_FRONTEND_HOST, // Change this if you want to use a different hostname
  },
})
