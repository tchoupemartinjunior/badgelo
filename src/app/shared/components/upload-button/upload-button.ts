import { Component, Output, EventEmitter, signal, input } from '@angular/core';

@Component({
  selector: 'bdge-upload-button',
  imports: [],
  templateUrl: './upload-button.html',
  styleUrl: './upload-button.scss',
})
export class UploadButton {
  @Output() fileSelected = new EventEmitter<File>();

  backgroundColor = input<string>('bg-purple-700');

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input || !input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.fileSelected.emit(file);
  }
}
