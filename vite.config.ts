import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { runtimeAssetsPlugin } from './scripts/game/runtime-assets.ts';
export default defineConfig({
  plugins: [react(), runtimeAssetsPlugin()],
  publicDir: 'pwa',
  build: { target: 'es2023', outDir: 'dist', sourcemap: false },
  server: {
    proxy: { '/api': process.env.RO_API_PROXY_URL || 'http://127.0.0.1:8787' },
    watch: { ignored: ['**/assets/ro/**', '**/runtime/ro/payload/**', '**/plan/**', '**/preview/**', '**/.venv/**', '**/.local/**'] },
    fs: { deny: ['.env', '.env.*', '**/.git/**', '**/assets/ro/**', '**/.local/**'] },
  },
});
