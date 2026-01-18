import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EditorState {
  brightness = signal(100);
  contrast = signal(100);

  setBrightness(value: number) {
    this.brightness.set(value);
  }
  setContrast(value: number) {
    this.contrast.set(value);
  }
  
}
