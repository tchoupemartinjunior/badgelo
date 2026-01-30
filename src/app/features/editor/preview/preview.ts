import { Component, inject, ViewChild, ElementRef, effect } from '@angular/core';
import { FileService } from '@shared/services/file.service';
import { EditorStateService } from '../state/editor-state.service';

@Component({
  selector: 'bdge-preview',
  imports: [],
  templateUrl: './preview.html'
})
export class Preview {
  @ViewChild('previewImage') previewImage!: ElementRef<HTMLCanvasElement>;

  fileService = inject(FileService);
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
