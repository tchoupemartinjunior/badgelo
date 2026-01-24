import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FileUploader } from "@shared/components/file-uploader/file-uploader";
import { FileUploadService } from '@shared/services/file-upload.service';

@Component({
  selector: 'bdge-home',
  imports: [FileUploader],
  templateUrl: './home.html'
})
export class Home {
  router = inject(Router);
  fileUploadService = inject(FileUploadService);
  onFileSelected($event: File) {
    this.fileUploadService.upload($event);
    this.router.navigate(['/editor']);
  }

}
