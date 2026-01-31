import { inject, Injectable, signal } from '@angular/core';
import { EditorStateService } from '../../features/editor/state/editor-state.service';
import { CanvasService } from './canvas.service';
import { Analytics } from './analytics';


@Injectable({
    providedIn: 'root'
})
export class FileService {
    editorStateService = inject(EditorStateService);
    canvasService = inject(CanvasService);
    analyticsService = inject(Analytics);

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
        this.canvasService.drawImageToCanvas(this.previewUrl());
        this.editorStateService.resetEditor();
        this.analyticsService.track('upload_image', {
            event_category: 'file_management',
            event_label: 'image_upload'
        });
    }


    download() {
        if (!this.previewUrl()) return;
        const canvas = this.editorStateService.canvas();
        if (!canvas) return;
        this.canvasService.exportAndDownload(this.previewUrl()!, canvas);
        this.analyticsService.track('download_image', {
            event_category: 'file_management',
            event_label: 'image_download'
        });
    }
}