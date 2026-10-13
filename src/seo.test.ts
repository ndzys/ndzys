// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const html = read('index.html');
const SITE = 'https://nazardzys.nvsoftlab.com/';

const decode = (text: string) =>
  text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const meta = (attr: 'name' | 'property', key: string) => {
  const value = html.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`))?.[1];
  return value === undefined ? undefined : decode(value);
};

describe('SEO', () => {
  it('has a descriptive title and meta description', () => {
    expect(html).toMatch(/<title>Nazar Dzys · [^<]+<\/title>/);
    const description = meta('name', 'description') ?? '';
    expect(description.length).toBeGreaterThanOrEqual(70);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('declares language and canonical URL', () => {
    expect(html).toContain('<html lang="en">');
    expect(html).toContain(`<link rel="canonical" href="${SITE}" />`);
  });

  it('has absolute Open Graph and Twitter images', () => {
    expect(meta('property', 'og:url')).toBe(SITE);
    expect(meta('property', 'og:image')).toBe(`${SITE}og-image.jpg`);
    expect(meta('name', 'twitter:image')).toBe(`${SITE}og-image.jpg`);
  });

  it('includes valid Person structured data', () => {
    const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    const person = JSON.parse(json ?? '{}');
    expect(person['@type']).toBe('Person');
    expect(person.name).toBe('Nazar Dzys');
    expect(person.url).toBe(SITE);
    expect(person.sameAs).toEqual(['https://github.com/ndzys', 'https://www.linkedin.com/in/nazar-dzys/']);
  });

  it('exposes robots.txt and a sitemap for the canonical URL', () => {
    expect(read('public/robots.txt')).toContain(`Sitemap: ${SITE}sitemap.xml`);
    expect(read('public/sitemap.xml')).toContain(`<loc>${SITE}</loc>`);
  });
});
