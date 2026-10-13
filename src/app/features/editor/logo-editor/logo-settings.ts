export type LogoPosition = 'tl' | 'tc' | 'tr' | 'ml' | 'mc' | 'mr' | 'bl' | 'bc' | 'br';

export interface LogoSettings {
  /** URL (blob) du logo importé, `null` tant qu'aucun logo n'est choisi. */
  url: string | null;
  name: string;
  position: LogoPosition;
  /** Largeur du logo en % de la largeur de l'image. */
  size: number;
  /** Opacité en %. */
  opacity: number;
}

export const LOGO_SIZE_MIN = 8;
export const LOGO_SIZE_MAX = 40;
export const LOGO_OPACITY_MIN = 20;
export const LOGO_OPACITY_MAX = 100;

export const DEFAULT_LOGO: LogoSettings = {
  url: null,
  name: '',
  position: 'br',
  size: 18,
  opacity: 100,
};

/** Ordre de lecture de la grille 3×3. */
export const LOGO_POSITIONS: readonly { value: LogoPosition; labelKey: string }[] = [
  { value: 'tl', labelKey: 'LOGO_EDITOR.POSITIONS.TL' },
  { value: 'tc', labelKey: 'LOGO_EDITOR.POSITIONS.TC' },
  { value: 'tr', labelKey: 'LOGO_EDITOR.POSITIONS.TR' },
  { value: 'ml', labelKey: 'LOGO_EDITOR.POSITIONS.ML' },
  { value: 'mc', labelKey: 'LOGO_EDITOR.POSITIONS.MC' },
  { value: 'mr', labelKey: 'LOGO_EDITOR.POSITIONS.MR' },
  { value: 'bl', labelKey: 'LOGO_EDITOR.POSITIONS.BL' },
  { value: 'bc', labelKey: 'LOGO_EDITOR.POSITIONS.BC' },
  { value: 'br', labelKey: 'LOGO_EDITOR.POSITIONS.BR' },
];
