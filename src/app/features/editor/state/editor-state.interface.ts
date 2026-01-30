export interface EditorState {
  brightness: number;
  contrast: number;
  saturation: number;
  //filter: 'none' | 'bw' | 'sepia';
  badge: Badge | null;
  // watermark?: Watermark;
}

export interface Badge {
  type: string;
  color: string;
  text: string;
}