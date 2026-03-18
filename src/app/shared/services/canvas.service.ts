import { Injectable, inject } from '@angular/core';
import { EditorStateService } from '../../features/editor/state/editor-state.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
    providedIn: 'root'
})
export class CanvasService {
    private editorStateService = inject(EditorStateService);
    private translateService = inject(TranslateService);

    async drawImageToCanvas(previewUrl: string | null): Promise<void> {
        const canvas = this.editorStateService.canvas();
        if (!canvas || !previewUrl) return;
        if (this.editorStateService.hasBadge()) {
            return this.renderImage(previewUrl, canvas, this.drawOverlay.bind(this));
        }
        return this.renderImage(previewUrl, canvas);
    }

    async renderImage(
        previewUrl: string,
        canvas: HTMLCanvasElement,
        overlay?: (ctx: CanvasRenderingContext2D, img: HTMLImageElement) => void
    ): Promise<void> {
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = previewUrl;

        await new Promise<void>((resolve, reject) => {
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // Apply filters using pixel manipulation for better mobile support
                this.applyFilters(ctx, canvas);

                if (overlay) overlay(ctx, img);
                resolve();
            };
            img.onerror = () => reject(new Error('Failed to load image'));
        });
    }

    private applyFilters(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
        const brightness = this.editorStateService.brightness();
        const contrast = this.editorStateService.contrast();
        const saturation = this.editorStateService.saturation();

        // Skip if all values are at default (100)
        if (brightness === 100 && contrast === 100 && saturation === 100) {
            return;
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Convert brightness/contrast/saturation percentages to normalized values
        const brightnessAdjust = (brightness - 100) / 100;
        const contrastAdjust = contrast / 100;
        const saturationAdjust = saturation / 100;

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];
            const a = data[i + 3];

            // Apply brightness
            r = Math.min(255, r * (1 + brightnessAdjust));
            g = Math.min(255, g * (1 + brightnessAdjust));
            b = Math.min(255, b * (1 + brightnessAdjust));

            // Apply contrast
            const contrastCenter = 128;
            r = Math.max(0, Math.min(255, (r - contrastCenter) * contrastAdjust + contrastCenter));
            g = Math.max(0, Math.min(255, (g - contrastCenter) * contrastAdjust + contrastCenter));
            b = Math.max(0, Math.min(255, (b - contrastCenter) * contrastAdjust + contrastCenter));

            // Apply saturation (convert RGB to HSL, adjust saturation, convert back)
            if (saturation !== 100) {
                const hsl = this.rgbToHsl(r, g, b);
                hsl.s = hsl.s * saturationAdjust;
                hsl.s = Math.max(0, Math.min(1, hsl.s));
                const rgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
                r = rgb.r;
                g = rgb.g;
                b = rgb.b;
            }

            data[i] = Math.round(r);
            data[i + 1] = Math.round(g);
            data[i + 2] = Math.round(b);
            data[i + 3] = a;
        }

        ctx.putImageData(imageData, 0, 0);
    }

    private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                    break;
                case g:
                    h = ((b - r) / d + 2) / 6;
                    break;
                case b:
                    h = ((r - g) / d + 4) / 6;
                    break;
            }
        }

        return { h, s, l };
    }

    private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    async exportAndDownload(previewUrl: string, canvas: HTMLCanvasElement, filename = 'Badgelo-edited-image.png'): Promise<void> {
        await this.drawImageToCanvas(previewUrl);

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

        // Déterminer si c'est un badge personnalisé
        const isCustomBadge = this.editorStateService.badgeType().includes('Badge Personnalisé') ||
            this.editorStateService.badgeType().includes('Custom Badge');

        // Ligne 1 - Afficher le titre personnalisé si c'est un badge custom, sinon le type
        ctx.font = `600 ${subtitleSize}px Arial`;
        ctx.fillText(
            isCustomBadge ? (this.editorStateService.badgeCustomTitle() || 'Badge') : (this.editorStateService.badgeType() || 'Joyeux Anniversaire'),
            width / 2,
            height - bottomPadding - titleSize - lineSpacing
        );

        // Ligne 2 (très visible)
        ctx.font = `900 ${titleSize}px Arial`;
        ctx.fillText(
            this.editorStateService.badgeText() || this.translateService.instant('BADGE_EDITOR.TEXT_PLACEHOLDER'),
            width / 2,
            height - bottomPadding
        );

        // ajouter un filigrane "Made with Badgelo" en bas à droite
        const watermarkText = 'Badgelo';
        const watermarkFontSize = Math.round(width * 0.02);
        ctx.font = `400 ${watermarkFontSize}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(watermarkText, width - 10, height - 10);
    }
}
