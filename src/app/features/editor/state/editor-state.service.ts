import { Injectable, signal, computed, inject } from '@angular/core';
import { EditorState } from './editor-state.interface';

@Injectable({
  providedIn: 'root',
})
export class EditorStateService {

  imageState = signal<EditorState>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    badge: null,
  });

  readonly brightness = computed(() => this.imageState().brightness);
  readonly contrast = computed(() => this.imageState().contrast);
  readonly saturation = computed(() => this.imageState().saturation);
  readonly badgeText = computed(() => this.imageState().badge?.text || '');
  readonly badgeType = computed(() => this.imageState().badge?.type || '');
  readonly badgeColor = computed(() => this.imageState().badge?.color || '');

  readonly imageStyleFilter = computed(() => {
    return `brightness(${this.brightness()}%) contrast(${this.contrast()}%) saturate(${this.saturation()}%)`;
  });


  resetEditor() {
    this.imageState.set({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      badge: null
    });
  }

  setBrightness(value: number) {
    this.imageState.update(s => ({ ...s, brightness: value }));
  }
  setContrast(value: number) {
    this.imageState.update(s => ({ ...s, contrast: value }));
  }
  setSaturation(value: number) {
    this.imageState.update(s => ({ ...s, saturation: value }));
  }

  setBadgeText(text: string) {
    const currentState = this.imageState();
    const updatedBadge = { ...currentState.badge, text } as EditorState['badge'];
    this.imageState.update(s => ({ ...s, badge: updatedBadge }));
  }

  setBadgeType(type?: string) {
    const currentState = this.imageState();
    const updatedBadge = { ...currentState.badge, type } as EditorState['badge'];
    this.imageState.update(s => ({ ...s, badge: updatedBadge }));
    console.log('Badge type set to:', type);
  }

  setBadgeColor(color: string) {
    const currentState = this.imageState();
    const updatedBadge = { ...currentState.badge, color } as EditorState['badge'];
    this.imageState.update(s => ({ ...s, badge: updatedBadge }));
  }


  hasChanges(): boolean {
    const state = this.imageState();
    return state.brightness !== 100 || state.contrast !== 100 || state.saturation !== 100;
  }

}
