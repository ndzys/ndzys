// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { render } from './entry-server';

describe('prerender', () => {
  it('renders the page without browser globals', () => {
    const html = render();
    expect(html).toContain('Hire me to unlock your team');
    expect(html).toContain('Nazar Dzys');
    expect(html).toContain('/Nazar_Dzys_CV.pdf');
  });
});
