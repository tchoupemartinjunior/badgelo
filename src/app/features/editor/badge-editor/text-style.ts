export type BadgeFontId = 'classic' | 'modern' | 'elegant' | 'festive';
export type TextAlign = 'left' | 'center' | 'right';
export type TextPosition = 'top' | 'middle' | 'bottom';

export interface TextStyle {
  font: BadgeFontId;
  /** Taille du texte en % de la taille de base (100 = rendu historique). */
  size: number;
  align: TextAlign;
  position: TextPosition;
}

export interface BadgeFont {
  id: BadgeFontId;
  /** Clé de traduction du nom affiché. */
  labelKey: string;
  /** Pile CSS `font-family`, utilisée à la fois dans l'interface et dans le canvas. */
  family: string;
  /** Graisse de la ligne « type de badge ». */
  titleWeight: number;
  /** Graisse de la ligne « message ». */
  textWeight: number;
}

export const TEXT_SIZE_MIN = 60;
export const TEXT_SIZE_MAX = 160;

export const DEFAULT_TEXT_STYLE: TextStyle = {
  font: 'classic',
  size: 100,
  align: 'center',
  position: 'bottom',
};

export const BADGE_FONTS: readonly BadgeFont[] = [
  { id: 'classic', labelKey: 'BADGE_EDITOR.FONTS.CLASSIC', family: 'Arial, sans-serif', titleWeight: 600, textWeight: 900 },
  { id: 'modern', labelKey: 'BADGE_EDITOR.FONTS.MODERN', family: "'Poppins', sans-serif", titleWeight: 600, textWeight: 800 },
  { id: 'elegant', labelKey: 'BADGE_EDITOR.FONTS.ELEGANT', family: "'Playfair Display', serif", titleWeight: 700, textWeight: 900 },
  { id: 'festive', labelKey: 'BADGE_EDITOR.FONTS.FESTIVE', family: "'Pacifico', cursive", titleWeight: 400, textWeight: 400 },
];

export interface TextAlignOption {
  value: TextAlign;
  labelKey: string;
  /** Tracé SVG (viewBox 24×24) de l'icône. */
  iconPath: string;
}

export interface TextPositionOption {
  value: TextPosition;
  labelKey: string;
}

export const TEXT_ALIGN_OPTIONS: readonly TextAlignOption[] = [
  { value: 'left', labelKey: 'BADGE_EDITOR.TEXT_STYLE.ALIGN.LEFT', iconPath: 'M4 6h16M4 12h10M4 18h14' },
  { value: 'center', labelKey: 'BADGE_EDITOR.TEXT_STYLE.ALIGN.CENTER', iconPath: 'M4 6h16M7 12h10M5 18h14' },
  { value: 'right', labelKey: 'BADGE_EDITOR.TEXT_STYLE.ALIGN.RIGHT', iconPath: 'M4 6h16M10 12h10M6 18h14' },
];

export const TEXT_POSITION_OPTIONS: readonly TextPositionOption[] = [
  { value: 'top', labelKey: 'BADGE_EDITOR.TEXT_STYLE.POSITION.TOP' },
  { value: 'middle', labelKey: 'BADGE_EDITOR.TEXT_STYLE.POSITION.MIDDLE' },
  { value: 'bottom', labelKey: 'BADGE_EDITOR.TEXT_STYLE.POSITION.BOTTOM' },
];
