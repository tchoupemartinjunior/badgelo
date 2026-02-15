import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { SliderComponent } from '@shared/components/slider/slider';
import { EditorStateService } from '../state/editor-state.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'bdge-photo-editor',
  imports: [NgTemplateOutlet, SliderComponent, TranslateModule],
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
    { key: 'base', label: 'PHOTO_EDITOR.ACCORDIONS.BASE' },
    { key: 'filters', label: 'PHOTO_EDITOR.ACCORDIONS.FILTERS' },
    { key: 'transform', label: 'PHOTO_EDITOR.ACCORDIONS.TRANSFORM' }
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
