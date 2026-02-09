import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FileUploader } from "@shared/components/file-uploader/file-uploader";
import { FileService } from '@shared/services/file.service';

@Component({
  selector: 'bdge-home',
  imports: [FileUploader, TranslateModule],
  templateUrl: './home.html'
})
export class Home {
  router = inject(Router);
  fileService = inject(FileService);

  onFileSelected($event: File) {
    this.fileService.upload($event);
    this.router.navigate(['/editor']);
  }

}
