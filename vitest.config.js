import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check if Firebase credentials are available
const hasFirebaseCredentials = !!process.env.VITE_FIREBASE_API_KEY;

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    pool: 'forks',
    isolate: true,
    maxWorkers: 1,
    poolOptions: {
      forks: {
        execArgv: ['--max-old-space-size=4096'],
      },
    },
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'api/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/setup.ts',
        '**/*.config.js',
        '**/dist/**',
        '**/__tests__/**',
        'e2e/**',
      ],
      thresholds: {
        lines: 10,
        functions: 10,
        branches: 10,
        statements: 10,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Mock Firebase in CI when credentials are not available
      ...(hasFirebaseCredentials
        ? {}
        : {
            '../firebase': path.resolve(__dirname, './src/__mocks__/firebase.ts'),
            '../../firebase': path.resolve(__dirname, './src/__mocks__/firebase.ts'),
            '../../../firebase': path.resolve(__dirname, './src/__mocks__/firebase.ts'),
          }),
    },
  },
});
