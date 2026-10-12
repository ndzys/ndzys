import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// The CV links only render when the PDF is actually shipped, so the live
// site never points at a 404.
const CV_FILE = 'nazar-dzys-cv.pdf';
const hasCv = existsSync(fileURLToPath(new URL(`./public/${CV_FILE}`, import.meta.url)));

if (!hasCv) {
  console.warn(`\n[ndzys] public/${CV_FILE} not found — "Download CV" links are hidden.\n`);
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
