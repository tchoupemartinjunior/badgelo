import { Injectable, signal, computed, inject } from '@angular/core';
import { EditorState } from './editor-state.interface';
import { Analytics } from '@shared/services/analytics';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class EditorStateService {
  analyticsService = inject(Analytics);
  translateService = inject(TranslateService);
  _canvas = signal<HTMLCanvasElement | null>(null);

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
  readonly canvas = computed(() => this._canvas());

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
    this.analyticsService.track('adjust_brightness', {
      event_category: 'photo_edit',
      event_label: 'brightness_slider'
    });
  }
  setContrast(value: number) {
    this.imageState.update(s => ({ ...s, contrast: value }));
    this.analyticsService.track('adjust_contrast', {
      event_category: 'photo_edit',
      event_label: 'contrast_slider'
    });
  }
  setSaturation(value: number) {
    this.imageState.update(s => ({ ...s, saturation: value }));
    this.analyticsService.track('adjust_saturation', {
      event_category: 'photo_edit',
      event_label: 'saturation_slider'
    });
  }
  setCanvas(canvas: HTMLCanvasElement) {
    this._canvas.set(canvas);
  }

  setBadgeText(text: string) {
    const currentState = this.imageState();
    const updatedBadge = { ...currentState.badge, text } as EditorState['badge'];
    this.imageState.update(s => ({ ...s, badge: updatedBadge }));
    this.analyticsService.track('update_badge_text', {
      event_category: 'badge_edit',
      event_label: 'badge_text_input'
    });
  }

  setBadgeType(type?: string) {
    const currentState = this.imageState();
    const translatedType = type ? this.translateService.instant(type) : '';
    const updatedBadge = { ...currentState.badge, type: translatedType } as EditorState['badge'];
    this.imageState.update(s => ({ ...s, badge: updatedBadge }));

    this.analyticsService.track('select_badge_type', {
      event_category: 'badge_edit',
      event_label: 'badge_type_select'
    });
  }

  setBadgeColor(color: string) {
    const currentState = this.imageState();
    const updatedBadge = { ...currentState.badge, color } as EditorState['badge'];
    this.imageState.update(s => ({ ...s, badge: updatedBadge }));

    this.analyticsService.track('select_badge_color', {
      event_category: 'badge_edit',
      event_label: 'badge_color_select'
    });
  }

  hasBadge(): boolean {
    return this.imageState().badge !== null;
  }

  hasChanges(): boolean {
    const state = this.imageState();
    return state.brightness !== 100 || state.contrast !== 100 || state.saturation !== 100 || state.badge !== null;
  }

}
