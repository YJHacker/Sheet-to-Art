import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
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
});
