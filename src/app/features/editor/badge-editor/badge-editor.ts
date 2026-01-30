import { Component, inject } from '@angular/core';
import { ButtonComponent } from "@shared/components/button/button";
import { EditorStateService } from '../state/editor-state.service';

@Component({
  selector: 'bdge-badge-editor',
  imports: [ButtonComponent],
  templateUrl: './badge-editor.html',
  styleUrl: './badge-editor.scss',
})
export class BadgeEditor {
  editorStateService = inject(EditorStateService);

  updateBadgeType(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const selectedType = selectElement.value;
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
    console.log('Badge text updated to:', text);
  }
}
