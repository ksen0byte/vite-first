import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../../src/util/html.ts';

describe('escapeHtml', () => {
  it('escapes all HTML and attribute delimiters while preserving ordinary names', () => {
    expect(escapeHtml(`<img src=x onerror=alert(1)>"'&`))
      .toBe('&lt;img src=x onerror=alert(1)&gt;&quot;&#39;&amp;');
    expect(escapeHtml("O'Connor")).toBe('O&#39;Connor');
  });
});
