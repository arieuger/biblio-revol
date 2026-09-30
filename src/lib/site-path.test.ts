import { describe, expect, it } from 'vitest';
import { withBase } from './site-path';
describe('GitHub Pages asset paths', () => {
  it('adds the project base to local assets without doubling it', () => {
    expect(withBase('/logo.png', '/biblio-revol/')).toBe('/biblio-revol/logo.png');
    expect(withBase('/biblio-revol/logo.png', '/biblio-revol/')).toBe('/biblio-revol/logo.png');
    expect(withBase('/settings/library-composition.json', '/')).toBe('/settings/library-composition.json');
  });
  it('preserves uploaded SVG data, external and relative paths', () => {
    for (const source of ['data:image/svg+xml;base64,abc', 'https://example.org/image.png', '//example.org/a.png', 'assets/a.svg', 'blob:abc']) expect(withBase(source, '/biblio-revol/')).toBe(source);
  });
});
