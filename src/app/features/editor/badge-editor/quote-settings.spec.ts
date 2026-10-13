import { formatQuote } from './quote-settings';

describe('formatQuote', () => {
  it('wraps the text in French guillemets with non-breaking spaces', () => {
    expect(formatQuote('Servir', 'french')).toBe('\u00AB\u00A0Servir\u00A0\u00BB');
  });

  it('does not double the quotation marks typed by the user', () => {
    expect(formatQuote('\u201C Servir \u201D', 'curly')).toBe('\u201CServir\u201D');
    expect(formatQuote('"Servir"', 'straight')).toBe('"Servir"');
  });
});
