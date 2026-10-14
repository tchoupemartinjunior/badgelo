import { QuoteSettings } from '../badge-editor/quote-settings';
import { TextStyle } from '../badge-editor/text-style';
import { LogoSettings } from '../logo-editor/logo-settings';
import { FilterName, FrameSettings, Transform } from '@shared/utils/image-geometry';

export interface EditorState {
  brightness: number;
  contrast: number;
  saturation: number;
  filter: FilterName;
  transform: Transform;
  frame: FrameSettings;
  badge: Badge | null;
  textStyle: TextStyle;
  logo: LogoSettings;
  /** Texte « Badgelo » répété en diagonale sur la photo. */
  watermark: boolean;
  // watermark?: Watermark;
}

export interface Badge {
  type: string;
  color: string;
  text: string;
  customTitle?: string; // Title displayed on canvas when custom badge is selected
  /** Auteur, guillemets et disposition d'une citation. */
  quote?: QuoteSettings;
}
