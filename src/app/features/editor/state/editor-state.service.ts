import { Injectable, signal, computed, inject, effect, untracked } from '@angular/core';
import { EditorState } from './editor-state.interface';
import { DEFAULT_QUOTE, QuoteLayout, QuoteMarks, QuoteSettings } from '../badge-editor/quote-settings';
import { Analytics } from '@shared/services/analytics';
import { TranslateService } from '@ngx-translate/core';
import {
  BadgeFontId,
  DEFAULT_TEXT_STYLE,
  TEXT_SIZE_MAX,
  TEXT_SIZE_MIN,
  TextAlign,
  TextPosition,
  TextStyle,
} from '../badge-editor/text-style';
import {
  DEFAULT_LOGO,
  LOGO_OPACITY_MAX,
  LOGO_OPACITY_MIN,
  LOGO_SIZE_MAX,
  LOGO_SIZE_MIN,
  LogoPosition,
} from '../logo-editor/logo-settings';
import {
  DEFAULT_FRAME,
  DEFAULT_TRANSFORM,
  FilterName,
  FrameFormat,
  FrameSettings,
  FrameShape,
  ROTATION_MAX,
  ROTATION_MIN,
  Size,
  Transform,
  ZOOM_MAX,
  ZOOM_MIN,
  clampOffsets,
} from '@shared/utils/image-geometry';

/** Nombre maximum d'étapes conservées pour annuler / rétablir. */
const HISTORY_LIMIT = 50;
/** Les modifications rapprochées (glisser un curseur) forment une seule étape. */
const HISTORY_MERGE_MS = 600;

export function createDefaultState(): EditorState {
  return {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    filter: 'none',
    transform: { ...DEFAULT_TRANSFORM },
    frame: { ...DEFAULT_FRAME },
    badge: null,
    textStyle: { ...DEFAULT_TEXT_STYLE },
    logo: { ...DEFAULT_LOGO },
    watermark: false,
  };
}

@Injectable({
  providedIn: 'root',
})
export class EditorStateService {
  analyticsService = inject(Analytics);
  translateService = inject(TranslateService);
  _canvas = signal<HTMLCanvasElement | null>(null);

  imageState = signal<EditorState>(createDefaultState());

  private readonly _imageSize = signal<Size | null>(null);
  /** Dimensions de la photo importée, connues une fois l'image chargée. */
  readonly imageSize = this._imageSize.asReadonly();

  private readonly past = signal<EditorState[]>([]);
  private readonly future = signal<EditorState[]>([]);
  readonly canUndo = computed(() => this.past().length > 0);
  readonly canRedo = computed(() => this.future().length > 0);
  private lastRecorded: EditorState = this.imageState();
  private lastChangeAt = 0;
  private restoring = false;

  readonly brightness = computed(() => this.imageState().brightness);
  readonly contrast = computed(() => this.imageState().contrast);
  readonly saturation = computed(() => this.imageState().saturation);
  readonly filter = computed(() => this.imageState().filter);
  readonly transform = computed(() => this.imageState().transform);
  readonly frame = computed(() => this.imageState().frame);
  readonly badgeText = computed(() => this.imageState().badge?.text || '');
  readonly badgeType = computed(() => this.imageState().badge?.type || '');
  readonly badgeColor = computed(() => this.imageState().badge?.color || '');
  readonly badgeCustomTitle = computed(() => this.imageState().badge?.customTitle || '');
  /** Vrai quand le type de badge choisi est « Citation » (ou « Quote »). */
  readonly isQuote = computed(() => /citation|quote/i.test(this.badgeType()));
  readonly quote = computed<QuoteSettings>(() => this.imageState().badge?.quote ?? DEFAULT_QUOTE);
  readonly textStyle = computed(() => this.imageState().textStyle);
  readonly logo = computed(() => this.imageState().logo);
  readonly watermark = computed(() => this.imageState().watermark);
  readonly canvas = computed(() => this._canvas());

  readonly imageStyleFilter = computed(() => {
    return `brightness(${this.brightness()}%) contrast(${this.contrast()}%) saturate(${this.saturation()}%)`;
  });

  constructor() {
    // Enregistre chaque modification de l'état pour pouvoir l'annuler.
    effect(() => {
      const state = this.imageState();
      untracked(() => this.record(state));
    });
  }

  resetEditor() {
    this.imageState.set(createDefaultState());
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

  /* --- Filtres, recadrage, cadre --- */

  setFilter(filter: FilterName) {
    this.imageState.update(s => ({ ...s, filter }));
    this.trackPhoto('select_filter', filter);
  }

  setZoom(zoom: number) {
    this.updateTransform({ zoom: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom)) });
    this.trackPhoto('adjust_zoom', 'zoom_slider');
  }

  setRotation(rotation: number) {
    this.updateTransform({ rotation: Math.min(ROTATION_MAX, Math.max(ROTATION_MIN, rotation)) });
    this.trackPhoto('adjust_rotation', 'rotation_slider');
  }

  /** Pivote la photo d'un quart de tour (1 = vers la droite, -1 = vers la gauche). */
  rotateQuarter(direction: 1 | -1) {
    this.updateTransform({ turns: this.transform().turns + direction, offsetX: 0, offsetY: 0 });
    this.trackPhoto('rotate_quarter', direction === 1 ? 'right' : 'left');
  }

  toggleFlip() {
    this.updateTransform({ flipX: !this.transform().flipX });
    this.trackPhoto('flip_photo', 'horizontal');
  }

  /** Déplace la photo dans le cadre (fractions de la taille du cadre). */
  setPan(offsetX: number, offsetY: number) {
    this.updateTransform({ offsetX, offsetY });
  }

  resetFraming() {
    this.updateTransform({ ...DEFAULT_TRANSFORM });
    this.trackPhoto('reset_framing', 'recenter_button');
  }

  setFrameFormat(format: FrameFormat) {
    // Le format « avatar » est toujours rond
    this.updateFrame(format === 'avatar' ? { format, shape: 'circle' } : { format });
    this.trackPhoto('select_frame_format', format);
  }

  setFrameShape(shape: FrameShape) {
    // Choisir une forme quitte le format « avatar », qui impose le cercle
    const leavesAvatar = this.frame().format === 'avatar';
    this.updateFrame(leavesAvatar ? { shape, format: 'square' } : { shape });
    this.trackPhoto('select_frame_shape', shape);
  }

  setImageSize(size: Size | null) {
    const current = this._imageSize();
    if (current?.width === size?.width && current?.height === size?.height) return;
    this._imageSize.set(size);
  }

  private updateTransform(patch: Partial<Transform>) {
    this.imageState.update(s => ({ ...s, transform: this.withValidOffsets({ ...s.transform, ...patch }, s.frame) }));
  }

  private updateFrame(patch: Partial<FrameSettings>) {
    this.imageState.update(s => {
      const frame = { ...s.frame, ...patch };
      return { ...s, frame, transform: this.withValidOffsets(s.transform, frame) };
    });
  }

  /** Garde la photo recouvrant tout le cadre après un changement de zoom, de rotation ou de cadre. */
  private withValidOffsets(transform: Transform, frame: FrameSettings): Transform {
    const size = this._imageSize();
    return size ? { ...transform, ...clampOffsets(size, frame, transform) } : transform;
  }

  private trackPhoto(event: string, label: string) {
    this.analyticsService.track(event, { event_category: 'photo_edit', event_label: label });
  }

  /* --- Logo et filigrane --- */

  // Les URL de logos ne sont pas révoquées : annuler / rétablir peut y revenir.
  setLogo(url: string, name: string) {
    this.imageState.update(s => ({ ...s, logo: { ...s.logo, url, name } }));
    this.trackLogo('upload_logo', 'logo_upload');
  }

  removeLogo() {
    this.imageState.update(s => ({ ...s, logo: { ...s.logo, url: null, name: '' } }));
    this.trackLogo('remove_logo', 'logo_remove');
  }

  setLogoPosition(position: LogoPosition) {
    this.imageState.update(s => ({ ...s, logo: { ...s.logo, position } }));
    this.trackLogo('select_logo_position', position);
  }

  setLogoSize(size: number) {
    const clamped = Math.min(LOGO_SIZE_MAX, Math.max(LOGO_SIZE_MIN, size));
    this.imageState.update(s => ({ ...s, logo: { ...s.logo, size: clamped } }));
    this.trackLogo('adjust_logo_size', 'logo_size_slider');
  }

  setLogoOpacity(opacity: number) {
    const clamped = Math.min(LOGO_OPACITY_MAX, Math.max(LOGO_OPACITY_MIN, opacity));
    this.imageState.update(s => ({ ...s, logo: { ...s.logo, opacity: clamped } }));
    this.trackLogo('adjust_logo_opacity', 'logo_opacity_slider');
  }

  setWatermark(watermark: boolean) {
    this.imageState.update(s => ({ ...s, watermark }));
    this.trackLogo('toggle_watermark', watermark ? 'on' : 'off');
  }

  private trackLogo(event: string, label: string) {
    this.analyticsService.track(event, { event_category: 'logo_edit', event_label: label });
  }

  /* --- Badge --- */

  setQuoteAuthor(author: string) { this.updateQuote({ author }); }
  setQuoteRole(role: string) { this.updateQuote({ role }); }
  setQuoteMarks(marks: QuoteMarks) { this.updateQuote({ marks }); }
  setQuoteLayout(layout: QuoteLayout) { this.updateQuote({ layout }); }

  private updateQuote(patch: Partial<QuoteSettings>) {
    this.imageState.update(s => {
      const badge = s.badge ?? { type: '', color: '', text: '' };
      return { ...s, badge: { ...badge, quote: { ...(badge.quote ?? DEFAULT_QUOTE), ...patch } } };
    });
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

  setCustomBadgeTitle(customTitle: string) {
    const currentState = this.imageState();
    const updatedBadge = { ...currentState.badge, customTitle } as EditorState['badge'];
    this.imageState.update(s => ({ ...s, badge: updatedBadge }));

    this.analyticsService.track('set_custom_badge_title', {
      event_category: 'badge_edit',
      event_label: 'custom_badge_title_input'
    });
  }

  setTextFont(font: BadgeFontId) {
    this.updateTextStyle({ font });
    this.analyticsService.track('select_text_font', {
      event_category: 'badge_edit',
      event_label: font
    });
  }

  setTextSize(size: number) {
    const clamped = Math.min(TEXT_SIZE_MAX, Math.max(TEXT_SIZE_MIN, size));
    this.updateTextStyle({ size: clamped });
    this.analyticsService.track('adjust_text_size', {
      event_category: 'badge_edit',
      event_label: 'text_size_slider'
    });
  }

  setTextAlign(align: TextAlign) {
    this.updateTextStyle({ align });
    this.analyticsService.track('select_text_align', {
      event_category: 'badge_edit',
      event_label: align
    });
  }

  setTextPosition(position: TextPosition) {
    this.updateTextStyle({ position });
    this.analyticsService.track('select_text_position', {
      event_category: 'badge_edit',
      event_label: position
    });
  }

  private updateTextStyle(patch: Partial<TextStyle>) {
    this.imageState.update(s => ({ ...s, textStyle: { ...s.textStyle, ...patch } }));
  }

  hasBadge(): boolean {
    return this.imageState().badge !== null;
  }

  hasChanges(): boolean {
    const state = this.imageState();
    const transform = state.transform;
    return state.brightness !== 100 || state.contrast !== 100 || state.saturation !== 100
      || state.filter !== 'none'
      || state.frame.format !== DEFAULT_FRAME.format || state.frame.shape !== DEFAULT_FRAME.shape
      || transform.zoom !== DEFAULT_TRANSFORM.zoom || transform.rotation !== DEFAULT_TRANSFORM.rotation
      || transform.turns !== DEFAULT_TRANSFORM.turns || transform.flipX !== DEFAULT_TRANSFORM.flipX
      || transform.offsetX !== DEFAULT_TRANSFORM.offsetX || transform.offsetY !== DEFAULT_TRANSFORM.offsetY
      || state.logo.url !== null || state.watermark
      || state.badge !== null;
  }

  /* --- Annuler / rétablir --- */

  undo() {
    const past = this.past();
    const previous = past[past.length - 1];
    if (!previous) return;
    this.past.set(past.slice(0, -1));
    this.future.update(f => [this.imageState(), ...f]);
    this.restore(previous);
  }

  redo() {
    const [next, ...rest] = this.future();
    if (!next) return;
    this.future.set(rest);
    this.past.update(p => [...p, this.imageState()]);
    this.restore(next);
  }

  /** Efface l'historique, par exemple quand une nouvelle photo est importée. */
  clearHistory() {
    this.past.set([]);
    this.future.set([]);
    this.lastRecorded = this.imageState();
    this.lastChangeAt = 0;
    this.restoring = false;
  }

  private restore(state: EditorState) {
    this.restoring = true;
    this.imageState.set(state);
  }

  private record(state: EditorState) {
    if (state === this.lastRecorded) return;
    if (this.restoring) {
      this.restoring = false;
      this.lastRecorded = state;
      this.lastChangeAt = 0;
      return;
    }
    const now = Date.now();
    if (now - this.lastChangeAt > HISTORY_MERGE_MS) {
      this.past.update(p => [...p.slice(-(HISTORY_LIMIT - 1)), this.lastRecorded]);
    }
    this.future.set([]);
    this.lastRecorded = state;
    this.lastChangeAt = now;
  }

}
