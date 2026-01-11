import { Component, inject } from '@angular/core';
import { FileUploadService } from '../../shared/services/file-upload.service';

@Component({
  selector: 'bdge-photo-editor',
  imports: [],
  templateUrl: './photo-editor.html',
  styleUrl: './photo-editor.scss',
})
export class PhotoEditor {
  fileUploadService = inject(FileUploadService);

}
