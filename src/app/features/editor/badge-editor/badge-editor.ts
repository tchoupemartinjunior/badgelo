import { Component, inject } from '@angular/core';
import { ButtonComponent } from "@shared/components/button/button";
import { EditorStateService } from '../state/editor-state.service';
import { BadgeType, BadgeTypeOptions } from './badge.enum';

@Component({
  selector: 'bdge-badge-editor',
  imports: [],
  templateUrl: './badge-editor.html',
  styleUrl: './badge-editor.scss',
})
export class BadgeEditor {
  editorStateService = inject(EditorStateService);
  readonly badgeTypeOptions = BadgeTypeOptions;

  updateBadgeType(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const selectedType = selectElement.value as BadgeType;
    this.editorStateService.setBadgeType(selectedType);
  }

  updateBadgeColor(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const color = inputElement.value;
    this.editorStateService.setBadgeColor(color);
  }

  updateBadgeText(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const text = inputElement.value;
    this.editorStateService.setBadgeText(text);
  }
}
