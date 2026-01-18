import { Component, inject } from '@angular/core';
import { FileUploadService } from '@shared/services/file-upload.service';

@Component({
  selector: 'bdge-preview',
  imports: [],
  templateUrl: './preview.html',
  styleUrl: './preview.scss',
})
export class Preview {
  fileUploadService = inject(FileUploadService);
}
