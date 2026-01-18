import { Component, inject, ViewChild, ElementRef } from '@angular/core';
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
  fileUploadService = inject(FileUploadService);
  activeTab: string = 'photo';

  tabs = [
    { key: 'photo', label: 'Edition Photo' },
    { key: 'badge', label: 'Badge' }
  ];


  onFileSelected($event: File) {
    this.fileUploadService.upload($event);
  }



  watermarkText: string = 'HAPPY BIRTHDAY';
  imageSrc: string | null = this.fileUploadService.previewUrl();

  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  download() {
    const canvas = this.canvas.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.src = this.imageSrc!;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.filter = 'brightness(120%) contrast(110%)';

      // cree un caree transparent avec un texte en filigrane
      ctx.drawImage(img, 0, 0);
      ctx.font = '120px serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.textAlign = 'center';

      ctx.fillText(this.watermarkText, canvas.width / 2, canvas.height - 20);
      // add blue background to text
      ctx.fillRect((canvas.width / 2) - (ctx.measureText(this.watermarkText).width / 2), canvas.height - 140, ctx.measureText(this.watermarkText).width + 20, 100);
      ctx.fillStyle = 'rgba(95, 95, 233, 0.5)';

      const link = document.createElement('a');
      link.download = 'edited-image.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  }

}
