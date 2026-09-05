import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify('api-key-not-used'),
      },
      server: {
        proxy: {
          '/api-proxy': 'http://localhost:5000',
          '/api': 'http://localhost:5000',
          '/ws-proxy': { target: 'ws://localhost:5000', ws: true },
        },
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(process.cwd(), '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('node_modules/recharts') || id.includes('node_modules/d3') || id.includes('node_modules/victory')) {
                return 'vendor-charts';
              }
              if (id.includes('node_modules/lucide-react')) {
                return 'vendor-icons';
              }
            }
          }
        },
        chunkSizeWarningLimit: 600,
      }
    };
});
