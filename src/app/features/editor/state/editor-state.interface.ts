import { TextStyle } from '../badge-editor/text-style';

export interface EditorState {
  brightness: number;
  contrast: number;
  saturation: number;
  //filter: 'none' | 'bw' | 'sepia';
  badge: Badge | null;
  textStyle: TextStyle;
  // watermark?: Watermark;
}

export interface Badge {
  type: string;
  color: string;
  text: string;
  customTitle?: string; // Title displayed on canvas when custom badge is selected
}