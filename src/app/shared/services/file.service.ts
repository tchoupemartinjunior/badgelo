import { inject, Injectable, signal } from '@angular/core';
import { EditorStateService } from '../../features/editor/state/editor-state.service';
import { CanvasService } from './canvas.service';


@Injectable({
    providedIn: 'root'
})
export class FileService {
    editorStateService = inject(EditorStateService);
    canvasService = inject(CanvasService);

    private _uploadedFile = signal<File | null>(null);
    private _previewUrl = signal<string | null>(null);
    private placeholderImageUrl = signal<string | null>('../../../assets/images/landscape-placeholder.svg');

    readonly previewUrl = this._previewUrl.asReadonly();
    readonly uploadedFile = this._uploadedFile.asReadonly();
    readonly placeholderUrl = this.placeholderImageUrl.asReadonly();

    getUploadedFile() {
        return this.uploadedFile();
    }

    upload(file: File): void {
        this._uploadedFile.set(file);
        this._previewUrl.set(URL.createObjectURL(file));
        this.canvasService.drawImageToCanvas(this.previewUrl()!, this.editorStateService.canvas()!);
        this.editorStateService.resetEditor();
    }


    download() {
        if (!this.previewUrl()) return;
        const canvas = this.editorStateService.canvas();
        if (!canvas) return;
        this.canvasService.exportAndDownload(this.previewUrl()!, canvas);
    }
}