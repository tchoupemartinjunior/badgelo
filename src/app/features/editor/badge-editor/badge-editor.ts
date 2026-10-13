import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonComponent } from "@shared/components/button/button";
import { EditorStateService } from '../state/editor-state.service';
import { BadgeType, BadgeTypeOptions } from './badge.enum';
import { PredefinedBadgeColors, PredefinedBadgeColorsArray } from './colors/colors.enum';
import { TranslateModule } from '@ngx-translate/core';
import { SliderComponent } from '@shared/components/slider/slider';
import {
  BADGE_FONTS,
  BadgeFontId,
  TEXT_ALIGN_OPTIONS,
  TEXT_POSITION_OPTIONS,
  TEXT_SIZE_MAX,
  TEXT_SIZE_MIN,
  TextAlign,
  TextPosition,
} from './text-style';

@Component({
  selector: 'bdge-badge-editor',
  imports: [TranslateModule, SliderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badge-editor.html',
  styleUrl: './badge-editor.scss',
})
export class BadgeEditor {

  editorStateService = inject(EditorStateService);
  readonly badgeTypeOptions = BadgeTypeOptions;
  readonly predefinedBadgeColors = PredefinedBadgeColorsArray;

  readonly textStyle = this.editorStateService.textStyle;
  readonly fonts = BADGE_FONTS;
  readonly alignOptions = TEXT_ALIGN_OPTIONS;
  readonly positionOptions = TEXT_POSITION_OPTIONS;
  readonly textSizeMin = TEXT_SIZE_MIN;
  readonly textSizeMax = TEXT_SIZE_MAX;

  updateBadgeType(event: Event) {
    this.updateBadgeText();
    const selectElement = event.target as HTMLSelectElement;
    const selectedType = selectElement.value as BadgeType;
    this.editorStateService.setBadgeType(selectedType);
  }

  updateBadgeColor(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const color = inputElement.value;
    this.editorStateService.setBadgeColor(color);
  }

  updateBadgeText(event?: Event) {
    const inputElement = event?.target as HTMLInputElement;
    const text = inputElement?.value || '';
    this.editorStateService.setBadgeText(text);
  }

  selectPredefinedColor(color: string) {
    this.editorStateService.setBadgeColor(color);
  }

  selectFont(font: BadgeFontId) {
    this.editorStateService.setTextFont(font);
  }

  updateTextSize(size: number) {
    this.editorStateService.setTextSize(size);
  }

  selectAlign(align: TextAlign) {
    this.editorStateService.setTextAlign(align);
  }

  selectPosition(position: TextPosition) {
    this.editorStateService.setTextPosition(position);
  }

  /** Classes d'un bouton d'option (police, alignement, position) selon son état. */
  optionClass(selected: boolean): string {
    return selected
      ? 'border-purple-700 bg-purple-700 text-white'
      : 'border-gray-300 bg-white text-gray-700 hover:border-purple-500';
  }

  fontClass(selected: boolean): string {
    return selected
      ? 'border-purple-700 bg-purple-50 ring-1 ring-purple-700'
      : 'border-gray-300 bg-white hover:border-purple-500';
  }

  isCustomBadgeType(): boolean {
    const badge = this.editorStateService.imageState().badge;
    const badgeType = badge?.type || '';
    return badgeType.includes('Badge Personnalisé') || badgeType.includes('Custom Badge');
  }

  updateCustomBadgeType(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const customTitle = inputElement.value;
    this.editorStateService.setCustomBadgeTitle(customTitle);
  }
}
