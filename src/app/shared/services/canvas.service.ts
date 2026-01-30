import { Injectable, inject } from '@angular/core';
import { EditorStateService } from '../../features/editor/state/editor-state.service';

@Injectable({
    providedIn: 'root'
})
export class CanvasService {
    private editorStateService = inject(EditorStateService);

    async drawImageToCanvas(previewUrl: string, canvas: HTMLCanvasElement): Promise<void> {
        return this.renderImage(previewUrl, canvas);
    }

    async renderImage(
        previewUrl: string,
        canvas: HTMLCanvasElement,
        overlay?: (ctx: CanvasRenderingContext2D, img: HTMLImageElement) => void
    ): Promise<void> {
        const ctx = canvas.getContext('2d')!;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = previewUrl;

        await new Promise<void>((resolve, reject) => {
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.filter = this.editorStateService.imageStyleFilter();
                ctx.drawImage(img, 0, 0);
                if (overlay) overlay(ctx, img);
                resolve();
            };
            img.onerror = () => reject(new Error('Failed to load image'));
        });
    }

    async exportAndDownload(previewUrl: string, canvas: HTMLCanvasElement, filename = 'Badgelo-edited-image.png'): Promise<void> {
        await this.drawImageToCanvas(previewUrl, canvas);
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
}
