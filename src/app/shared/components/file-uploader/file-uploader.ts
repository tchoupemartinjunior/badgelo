import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'bdge-file-uploader',
  imports: [],
  templateUrl: './file-uploader.html',
  styleUrl: './file-uploader.scss',
})
export class FileUploader {
  @Output() fileSelected = new EventEmitter<File>();

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input || !input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.fileSelected.emit(file);
  }

}
