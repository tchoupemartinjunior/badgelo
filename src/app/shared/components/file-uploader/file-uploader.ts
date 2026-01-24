import { Component, Output, EventEmitter } from '@angular/core';
import { UploadButton } from "../upload-button/upload-button";

@Component({
  selector: 'bdge-file-uploader',
  imports: [UploadButton],
  templateUrl: './file-uploader.html',
  styleUrl: './file-uploader.scss',
})
export class FileUploader {
  @Output() fileSelected = new EventEmitter<File>();

  onFileSelected(file: File) {
    this.fileSelected.emit(file);
  }

}
