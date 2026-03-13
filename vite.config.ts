/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: false,
        minify: 'esbuild',
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom', 'lucide-react'],
              utils: ['lodash', 'marked', 'diff'],
              pdf: ['pdfjs-dist', 'jspdf']
            }
          }
        }
      },
      define: {
        ...(env.API_KEY || env.GEMINI_API_KEY ? {
          'process.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY),
          'process.env.GEMINI_API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY)
        } : {})
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
