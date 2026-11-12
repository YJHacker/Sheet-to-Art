import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  // GitHub Pages serves the app from /Sheet-to-Art/. Keep the dev server at /.
  base: command === 'build' ? '/Sheet-to-Art/' : '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      ignored: [
        '**/.cargo/**',
        '**/.rustup/**',
        '**/.code-review-graph/**',
        '**/.claude-omniroute/**',
        '**/.claude/**',
        '**/node_modules/**',
        '**/dist/**',
      ],
    },
  },
  worker: {
    format: 'es',
    plugins: () => [react()],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude-omniroute/**', '**/.claude/**'],
  },
}));
