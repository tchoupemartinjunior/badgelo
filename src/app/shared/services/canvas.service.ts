import { Injectable, inject } from '@angular/core';
import { EditorStateService } from '../../features/editor/state/editor-state.service';

@Injectable({
    providedIn: 'root'
})
export class CanvasService {
    private editorStateService = inject(EditorStateService);

    async drawImageToCanvas(previewUrl: string, canvas: HTMLCanvasElement): Promise<void> {
        return this.renderImage(previewUrl, canvas, this.drawOverlay.bind(this));
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

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/png')
        );

        if (!blob) {
            throw new Error('Failed to create image blob');
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        // Some browsers (notably iOS Safari) ignore the download attribute.
        // Append link to the DOM so click() works reliably on mobile browsers.
        document.body.appendChild(link);

        const isDownloadSupported = 'download' in HTMLAnchorElement.prototype;
        const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !(window as any).MSStream;

        if (!isDownloadSupported || isIOS) {
            // Fallback: open in new tab so user can long-press to save the image.
            window.open(url, '_blank');
        } else {
            link.click();
        }

        setTimeout(() => {
            URL.revokeObjectURL(url);
            if (link.parentNode) link.parentNode.removeChild(link);
        }, 1000);
    }

    drawOverlay(
        ctx: CanvasRenderingContext2D,
        img: HTMLImageElement
    ): void {

        const width = img.width;
        const height = img.height;

        /* --- Dégradé bleu (bas de l’image) --- */
        const gradientHeight = height * 0.4;

        const gradient = ctx.createLinearGradient(
            0,
            height,
            0,
            height - gradientHeight
        );

        gradient.addColorStop(0, this.editorStateService.badgeColor() || 'rgba(0, 102, 204, 0.85)');
        gradient.addColorStop(1, 'rgba(0, 102, 204, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, height - gradientHeight, width, gradientHeight);

        /* --- Texte --- */
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        const titleSize = Math.round(width * 0.07);
        const subtitleSize = Math.round(width * 0.09);

        const lineSpacing = Math.round(subtitleSize * 0.6);
        const bottomPadding = Math.round(height * 0.05);

        // Ligne 1
        ctx.font = `600 ${subtitleSize}px Arial`;
        ctx.fillText(
            this.editorStateService.badgeType() || 'Joyeux Anniversaire',
            width / 2,
            height - bottomPadding - titleSize - lineSpacing

        );

        // Ligne 2 (très visible)
        ctx.font = `900 ${titleSize}px Arial`;
        ctx.fillText(
            this.editorStateService.badgeText() || 'Prenom',
            width / 2,
            height - bottomPadding
        );
    }
}
