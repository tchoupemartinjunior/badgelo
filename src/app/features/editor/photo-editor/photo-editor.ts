import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { SliderComponent } from '@shared/components/slider/slider';
import { EditorStateService } from '../state/editor-state.service';

@Component({
  selector: 'bdge-photo-editor',
  imports: [NgTemplateOutlet, SliderComponent],
  templateUrl: './photo-editor.html',
  styleUrl: './photo-editor.scss',
})
export class PhotoEditor {

  editorStateService = inject(EditorStateService);

  @ViewChild('baseTemplate', { static: true }) baseTemplate!: TemplateRef<any>;
  @ViewChild('filtersTemplate', { static: true }) filtersTemplate!: TemplateRef<any>;
  @ViewChild('transformTemplate', { static: true }) transformTemplate!: TemplateRef<any>;

  openAccordion: string | null = null;

  accordions = [
    { key: 'base', label: 'Réglages de base' },
    { key: 'filters', label: 'Filtres' },
    { key: 'transform', label: 'Transformations' }
  ];

  getTemplate(key: string): TemplateRef<any> {
    switch (key) {
      case 'base': return this.baseTemplate;
      case 'filters': return this.filtersTemplate;
      case 'transform': return this.transformTemplate;
      default: throw new Error('Template not found');
    }
  }

}
