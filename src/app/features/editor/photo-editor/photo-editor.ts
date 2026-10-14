import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SliderComponent } from '@shared/components/slider/slider';
import { FileService } from '@shared/services/file.service';
import {
  FilterName,
  FrameFormat,
  FrameShape,
  ROTATION_MAX,
  ROTATION_MIN,
  ZOOM_MAX,
  ZOOM_MIN,
  isRoundFrame,
} from '@shared/utils/image-geometry';
import { EditorStateService } from '../state/editor-state.service';

type AccordionKey = 'base' | 'transform' | 'filters';

/** Formats de cadre proposés (aussi affichés en puces sous l'aperçu sur mobile). */
export const FRAME_FORMATS: readonly { value: FrameFormat; labelKey: string }[] = [
  { value: 'free', labelKey: 'PHOTO_EDITOR.FORMATS.FREE' },
  { value: 'square', labelKey: 'PHOTO_EDITOR.FORMATS.SQUARE' },
  { value: 'story', labelKey: 'PHOTO_EDITOR.FORMATS.STORY' },
  { value: 'avatar', labelKey: 'PHOTO_EDITOR.FORMATS.AVATAR' },
];

@Component({
  selector: 'bdge-photo-editor',
  imports: [SliderComponent, TranslateModule],
  templateUrl: './photo-editor.html',
  styleUrl: './photo-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoEditor {

  readonly editorStateService = inject(EditorStateService);
  readonly fileService = inject(FileService);

  readonly accordions: readonly { key: AccordionKey; label: string }[] = [
    { key: 'base', label: 'PHOTO_EDITOR.ACCORDIONS.BASE' },
    { key: 'transform', label: 'PHOTO_EDITOR.ACCORDIONS.TRANSFORM' },
    { key: 'filters', label: 'PHOTO_EDITOR.ACCORDIONS.FILTERS' },
  ];

  readonly formats = FRAME_FORMATS;

  /** `iconClass` dessine la forme du cadre dans le bouton. */
  readonly shapes: readonly { value: FrameShape; labelKey: string; iconClass: string }[] = [
    { value: 'square', labelKey: 'PHOTO_EDITOR.SHAPES.SQUARE', iconClass: 'rounded-none' },
    { value: 'rounded', labelKey: 'PHOTO_EDITOR.SHAPES.ROUNDED', iconClass: 'rounded-md' },
    { value: 'circle', labelKey: 'PHOTO_EDITOR.SHAPES.CIRCLE', iconClass: 'rounded-full' },
  ];

  /** `css` est le filtre CSS qui reproduit l'effet sur les vignettes. */
  readonly filters: readonly { value: FilterName; labelKey: string; css: string }[] = [
    { value: 'none', labelKey: 'PHOTO_EDITOR.FILTERS.NONE', css: 'none' },
    { value: 'bw', labelKey: 'PHOTO_EDITOR.FILTERS.BW', css: 'grayscale(1)' },
    { value: 'sepia', labelKey: 'PHOTO_EDITOR.FILTERS.SEPIA', css: 'sepia(0.85)' },
  ];

  readonly zoomMin = ZOOM_MIN;
  readonly zoomMax = ZOOM_MAX;
  readonly rotationMin = ROTATION_MIN;
  readonly rotationMax = ROTATION_MAX;

  private readonly openSections = signal<ReadonlySet<AccordionKey>>(new Set<AccordionKey>(['base', 'transform', 'filters']));

  isOpen(key: AccordionKey): boolean {
    return this.openSections().has(key);
  }

  toggle(key: AccordionKey): void {
    this.openSections.update(open => {
      const next = new Set(open);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  /** Un cadre rond (ou le format avatar) sélectionne « Rond », quelle que soit la forme mémorisée. */
  isShapeSelected(shape: FrameShape): boolean {
    const frame = this.editorStateService.frame();
    return shape === 'circle' ? isRoundFrame(frame) : !isRoundFrame(frame) && frame.shape === shape;
  }

  /** Classes d'un bouton d'option selon son état. */
  optionClass(selected: boolean): string {
    return selected
      ? 'border-purple-700 bg-purple-700 text-white'
      : 'border-gray-300 bg-white text-gray-700 hover:border-purple-500';
  }

  filterClass(selected: boolean): string {
    return selected ? 'border-purple-700 bg-purple-50' : 'border-gray-200 bg-white hover:border-purple-500';
  }

}
