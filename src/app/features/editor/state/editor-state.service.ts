import { Injectable, signal, computed } from '@angular/core';
import { EditorState } from './editor-state.interface';

@Injectable({
  providedIn: 'root',
})
export class EditorStateService {
  imageState = signal<EditorState>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
  });
  readonly brightness = computed(() => this.imageState().brightness);
  readonly contrast = computed(() => this.imageState().contrast);
  readonly saturation = computed(() => this.imageState().saturation);

  setBrightness(value: number) {
    this.imageState.update(s => ({ ...s, brightness: value }));
  }
  setContrast(value: number) {
    this.imageState.update(s => ({ ...s, contrast: value }));
  }
  setSaturation(value: number) {
    this.imageState.update(s => ({ ...s, saturation: value }));
  }

  resetEditor() {
    this.imageState.set({
      brightness: 100,
      contrast: 100,
      saturation: 100,
    });
  }
}
