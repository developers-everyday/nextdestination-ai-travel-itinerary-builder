import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env from monorepo root
  const rootDir = path.resolve(__dirname, '../..');
  const env = loadEnv(mode, rootDir, '');
  return {
    // Point to monorepo root for .env files
    envDir: rootDir,
    server: {
      port: 3001,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.API_BASE_URL': JSON.stringify(env.API_BASE_URL || 'https://your-api-url.com'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@shared': path.resolve(__dirname, '../shared/src'),
      }
    },
    optimizeDeps: {
      include: ['@nextdestination/shared']
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    }
  };
});
