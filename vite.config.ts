import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

export default defineConfig(({ mode }) => {
  let https;
  if (mode === 'https') {
    try {
      https = {
        key: readFileSync(new URL('./.certs/dev-key.pem', import.meta.url)),
        cert: readFileSync(new URL('./.certs/dev-cert.pem', import.meta.url)),
      };
    } catch {
      throw new Error(
        'HTTPS needs .certs/dev-key.pem and .certs/dev-cert.pem. See README.md for phone certificate setup.',
      );
    }
  }
  return {
    base: mode === 'github-pages' ? '/pitch-perfect-studio/' : '/',
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    plugins: [react(), tailwindcss()],
    server: {
      host: '127.0.0.1',
      port: 5174,
      strictPort: true,
      https,
      watch: { usePolling: true, interval: 250 },
    },
    build: { outDir: 'dist', emptyOutDir: true, sourcemap: true },
  };
});
