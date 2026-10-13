export type QuoteMarks = 'french' | 'curly' | 'straight';
export type QuoteLayout = 'band' | 'card' | 'full';

export interface QuoteSettings {
  author: string;
  role: string;
  marks: QuoteMarks;
  layout: QuoteLayout;
}

export const DEFAULT_QUOTE: QuoteSettings = {
  author: '',
  role: '',
  marks: 'french',
  layout: 'band',
};

export const QUOTE_MARKS_OPTIONS: ReadonlyArray<{ value: QuoteMarks; sample: string; labelKey: string }> = [
  { value: 'french', sample: '\u00AB \u00BB', labelKey: 'BADGE_EDITOR.QUOTE.MARKS_FRENCH' },
  { value: 'curly', sample: '\u201C \u201D', labelKey: 'BADGE_EDITOR.QUOTE.MARKS_CURLY' },
  { value: 'straight', sample: '" "', labelKey: 'BADGE_EDITOR.QUOTE.MARKS_STRAIGHT' },
];

export const QUOTE_LAYOUT_OPTIONS: ReadonlyArray<{ value: QuoteLayout; labelKey: string }> = [
  { value: 'band', labelKey: 'BADGE_EDITOR.QUOTE.LAYOUT_BAND' },
  { value: 'card', labelKey: 'BADGE_EDITOR.QUOTE.LAYOUT_CARD' },
  { value: 'full', labelKey: 'BADGE_EDITOR.QUOTE.LAYOUT_FULL' },
];

/** Entoure la citation de guillemets, sans doubler ceux que l'utilisateur a déjà saisis. */
export function formatQuote(text: string, marks: QuoteMarks): string {
  const bare = text.trim().replace(/^[\u00AB\u201C\u201D"\s\u00A0]+|[\u00BB\u201C\u201D"\s\u00A0]+$/g, '');
  switch (marks) {
    case 'french':
      return `\u00AB\u00A0${bare}\u00A0\u00BB`;
    case 'curly':
      return `\u201C${bare}\u201D`;
    default:
      return `"${bare}"`;
  }
}
