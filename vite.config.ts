import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const CV_FILE = 'Nazar_Dzys_CV.pdf';
const hasCv = existsSync(fileURLToPath(new URL(`./public/${CV_FILE}`, import.meta.url)));

if (!hasCv) {
  console.warn(`public/${CV_FILE} not found, CV links will be hidden`);
}

export default defineConfig({
  base: '/',
  plugins: [react()],
  define: {
    __CV_FILE__: JSON.stringify(hasCv ? CV_FILE : ''),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    restoreMocks: true,
  },
});
