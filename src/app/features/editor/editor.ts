import { Component, inject, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { FileUploadService } from '../../shared/services/file-upload.service';
import { UploadButton } from "@shared/components/upload-button/upload-button";
import { Preview } from "./preview/preview";
import { NgClass } from '@angular/common';
import { ButtonComponent } from "@shared/components/button/button";
import { EditorStateService } from './state/editor-state.service';
import { PhotoEditor } from './photo-editor/photo-editor';

@Component({
  selector: 'bdge-editor',
  imports: [UploadButton, Preview, NgClass, PhotoEditor, ButtonComponent],
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
})

export class Editor {

  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  fileUploadService = inject(FileUploadService);
  editorStateService = inject(EditorStateService);

  activeTab: string = 'photo';

  tabs = [
    { key: 'photo', label: 'Edition Photo' },
    { key: 'badge', label: 'Badge' }
  ];


  download() {
    const canvas = this.canvas.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.src = this.fileUploadService.previewUrl()!;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const brightness = this.editorStateService.brightness();
      const contrast = this.editorStateService.contrast();
      const saturation = this.editorStateService.saturation();
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      ctx.drawImage(img, 0, 0);

      const link = document.createElement('a');
      link.download = 'edited-image.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  }

}
