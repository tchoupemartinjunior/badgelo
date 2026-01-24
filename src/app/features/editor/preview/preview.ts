import { Component, inject, ViewChild, ElementRef, effect } from '@angular/core';
import { FileUploadService } from '@shared/services/file-upload.service';
import { EditorStateService } from '../state/editor-state.service';

@Component({
  selector: 'bdge-preview',
  imports: [],
  templateUrl: './preview.html',
  styleUrl: './preview.scss',
})
export class Preview {
  @ViewChild('previewImage') previewImage!: ElementRef<HTMLCanvasElement>;


  fileUploadService = inject(FileUploadService);
  editorStateService = inject(EditorStateService);

  constructor() {
    effect(() => {
      const brightness = this.editorStateService.brightness();
      const contrast = this.editorStateService.contrast();
      const saturation = this.editorStateService.saturation();
      if (!this.previewImage) return;
      const imgElement = this.previewImage.nativeElement;
      imgElement.style.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    });
  }
}
