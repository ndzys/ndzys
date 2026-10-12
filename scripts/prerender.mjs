import { readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const htmlPath = `${root}dist/index.html`;
const serverDir = `${root}dist-server`;

const { render } = await import(`${serverDir}/entry-server.js`);
const html = await readFile(htmlPath, 'utf8');
const marker = '<div id="root"></div>';

if (!html.includes(marker)) throw new Error(`prerender: ${marker} not found in dist/index.html`);

await writeFile(htmlPath, html.replace(marker, `<div id="root">${render()}</div>`));
await rm(serverDir, { recursive: true, force: true });
console.log('prerender: dist/index.html');
