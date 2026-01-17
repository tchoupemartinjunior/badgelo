import { Component, inject, ViewChild,ElementRef } from '@angular/core';
import { FileUploadService } from '../../shared/services/file-upload.service';

@Component({
  selector: 'bdge-photo-editor',
  imports: [],
  templateUrl: './photo-editor.html',
  styleUrl: './photo-editor.scss',
})
export class PhotoEditor {
  fileUploadService = inject(FileUploadService);
  watermarkText: string = '';
  imageSrc: string|null = this.fileUploadService.previewUrl();

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
    ctx.rotate((5 * Math.PI) / 180);
    ctx.drawImage(img, 0, 0);

    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
}

}
