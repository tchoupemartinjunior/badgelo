import { Component, inject, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { FileUploadService } from '../../shared/services/file-upload.service';
import { UploadButton } from "@shared/components/upload-button/upload-button";
import { Preview } from "./preview/preview";
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'bdge-photo-editor',
  imports: [UploadButton, Preview, NgClass, NgTemplateOutlet],
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
})
export class Editor {
  @ViewChild('baseTemplate', { static: true }) baseTemplate!: TemplateRef<any>;
  @ViewChild('filtersTemplate', { static: true }) filtersTemplate!: TemplateRef<any>;
  @ViewChild('transformTemplate', { static: true }) transformTemplate!: TemplateRef<any>;


  fileUploadService = inject(FileUploadService);
  activeTab: string = 'photo';
  openAccordion: string | null = null;

  tabs = [
    { key: 'photo', label: 'Edition Photo' },
    { key: 'badge', label: 'Badge' }
  ];

  accordions = [
    { key: 'base', label: 'Réglages de base' },
    { key: 'filters', label: 'Filtres' },
    { key: 'transform', label: 'Transformations' }
  ];


  onFileSelected($event: File) {
    this.fileUploadService.upload($event);
  }

  getTemplate(key: string): TemplateRef<any> {
    console.log('Getting template for key:', key);
    console.log('Available templates:', {
      base: this.baseTemplate,
      filters: this.filtersTemplate,
      transform: this.transformTemplate
    });
    switch (key) {
      case 'base': return this.baseTemplate;
      case 'filters': return this.filtersTemplate;
      case 'transform': return this.transformTemplate;
      default: throw new Error('Template not found');
    }
  }



  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  download() {
    const canvas = this.canvas.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.src = this.fileUploadService.previewUrl()!;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.filter = 'brightness(120%) contrast(110%)';

      // cree un caree transparent avec un texte en filigrane
      ctx.drawImage(img, 0, 0);
      ctx.font = '120px serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.textAlign = 'center';

      const link = document.createElement('a');
      link.download = 'edited-image.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  }

}
