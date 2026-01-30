import { Component, inject, ViewChild, ElementRef, effect } from '@angular/core';
import { FileService } from '@shared/services/file.service';
import { EditorStateService } from '../editor/state/editor-state.service';

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
      this.editorStateService.hasChanges();
      if (!this.previewImage) return;
      const imgElement = this.previewImage.nativeElement;
      imgElement.style.filter = this.editorStateService.imageStyleFilter();
    });
  }
}
