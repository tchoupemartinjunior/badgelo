import { Injectable, inject } from '@angular/core';
import { EditorStateService } from '../../features/editor/state/editor-state.service';
import { TranslateService } from '@ngx-translate/core';
import { BADGE_FONTS, BadgeFont, BadgeFontId } from '../../features/editor/badge-editor/text-style';

interface TextBlock {
    lines: string[];
    size: number;
}

/** Interligne des textes sur plusieurs lignes, en multiple de la taille de police. */
const LINE_HEIGHT = 1.15;
const MIN_FONT_SIZE = 8;

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
            await this.ensureFontLoaded(this.editorStateService.textStyle().font);
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

        const style = this.editorStateService.textStyle();
        const font = this.findFont(style.font);
        const scale = style.size / 100;
        const badgeColor = this.editorStateService.badgeColor();

        // Déterminer si c'est un badge personnalisé
        const isCustomBadge = this.editorStateService.badgeType().includes('Badge Personnalisé') ||
            this.editorStateService.badgeType().includes('Custom Badge');

        // Ligne 1 - Afficher le titre personnalisé si c'est un badge custom, sinon le type
        const typeLine = isCustomBadge
            ? (this.editorStateService.badgeCustomTitle() || 'Badge')
            : (this.editorStateService.badgeType() || 'Joyeux Anniversaire');
        // Ligne 2 - le message
        const messageLine = this.editorStateService.badgeText() || this.translateService.instant('BADGE_EDITOR.PREVIEW_TEXT_FALLBACK');

        const sidePadding = Math.round(width * 0.06);
        const edgePadding = Math.round(height * 0.05);
        const maxTextWidth = width - sidePadding * 2;

        // Les tailles suivent le curseur ; le texte passe à la ligne et se réduit au besoin
        // pour ne jamais dépasser de l'image, quelle que soit sa longueur.
        const { typeBlock, messageBlock, lineSpacing, blockHeight } = this.layoutBadgeText(
            ctx, typeLine, messageLine, font,
            Math.round(width * 0.09 * scale), Math.round(width * 0.07 * scale),
            maxTextWidth, height - edgePadding * 2
        );

        const blockBottom = style.position === 'top'
            ? edgePadding + blockHeight
            : style.position === 'middle'
                ? (height + blockHeight) / 2
                : height - edgePadding;

        /* --- Dégradé de couleur derrière le texte --- */
        const gradientHeight = Math.min(height, Math.max(height * 0.4, blockHeight + edgePadding * 2));
        this.drawBadgeGradient(ctx, width, height, style.position, gradientHeight, badgeColor);

        /* --- Texte --- */
        const x = style.align === 'left'
            ? sidePadding
            : style.align === 'right'
                ? width - sidePadding
                : width / 2;

        ctx.fillStyle = this.textColorFor(badgeColor);
        ctx.textAlign = style.align;
        ctx.textBaseline = 'bottom';

        // Les lignes sont posées de bas en haut : message, puis type de badge
        const messageStep = messageBlock.size * LINE_HEIGHT;
        const typeStep = typeBlock.size * LINE_HEIGHT;
        const lastMessageIndex = messageBlock.lines.length - 1;
        const lastTypeIndex = typeBlock.lines.length - 1;

        ctx.font = `${font.textWeight} ${messageBlock.size}px ${font.family}`;
        messageBlock.lines.forEach((line, i) => {
            ctx.fillText(line, x, blockBottom - (lastMessageIndex - i) * messageStep);
        });

        const firstMessageBaseline = blockBottom - lastMessageIndex * messageStep;
        const typeBottom = firstMessageBaseline - messageBlock.size - lineSpacing;

        ctx.font = `${font.titleWeight} ${typeBlock.size}px ${font.family}`;
        typeBlock.lines.forEach((line, i) => {
            ctx.fillText(line, x, typeBottom - (lastTypeIndex - i) * typeStep);
        });

        // ajouter un filigrane "Made with Badgelo" en bas à droite
        const watermarkText = 'Badgelo';
        const watermarkFontSize = Math.round(width * 0.02);
        ctx.font = `400 ${watermarkFontSize}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(watermarkText, width - 10, height - 10);
    }

    private drawBadgeGradient(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        position: 'top' | 'middle' | 'bottom',
        gradientHeight: number,
        badgeColor: string
    ): void {
        const { solid, clear } = this.gradientColors(badgeColor);

        let top: number;
        let gradient: CanvasGradient;
        if (position === 'top') {
            top = 0;
            gradient = ctx.createLinearGradient(0, 0, 0, gradientHeight);
            gradient.addColorStop(0, solid);
            gradient.addColorStop(1, clear);
        } else if (position === 'middle') {
            top = (height - gradientHeight) / 2;
            gradient = ctx.createLinearGradient(0, top, 0, top + gradientHeight);
            gradient.addColorStop(0, clear);
            gradient.addColorStop(0.5, solid);
            gradient.addColorStop(1, clear);
        } else {
            top = height - gradientHeight;
            gradient = ctx.createLinearGradient(0, height, 0, top);
            gradient.addColorStop(0, solid);
            gradient.addColorStop(1, clear);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, top, width, gradientHeight);
    }

    private findFont(fontId: BadgeFontId) {
        return BADGE_FONTS.find(f => f.id === fontId) ?? BADGE_FONTS[0];
    }

    /** Les polices web doivent être chargées avant de dessiner, sinon le canvas utilise la police de repli. */
    private async ensureFontLoaded(fontId: BadgeFontId): Promise<void> {
        if (typeof document === 'undefined' || !document.fonts) return;
        const font = this.findFont(fontId);
        try {
            await Promise.all([
                document.fonts.load(`${font.titleWeight} 32px ${font.family}`),
                document.fonts.load(`${font.textWeight} 32px ${font.family}`),
            ]);
        } catch {
            // hors ligne : le canvas retombe sur la police générique de la pile
        }
    }

    /**
     * Découpe le type de badge et le message en lignes qui tiennent dans `maxWidth`,
     * en réduisant les polices jusqu'à ce que le bloc tienne aussi dans `maxBlockHeight`.
     */
    private layoutBadgeText(
        ctx: CanvasRenderingContext2D,
        typeLine: string,
        messageLine: string,
        font: BadgeFont,
        typeSize: number,
        messageSize: number,
        maxWidth: number,
        maxBlockHeight: number
    ): { typeBlock: TextBlock; messageBlock: TextBlock; lineSpacing: number; blockHeight: number } {
        const build = (factor: number) => {
            const typeBlock = this.wrapText(ctx, typeLine, font.titleWeight, Math.round(typeSize * factor), font.family, maxWidth);
            const messageBlock = this.wrapText(ctx, messageLine, font.textWeight, Math.round(messageSize * factor), font.family, maxWidth);
            const lineSpacing = Math.round(typeBlock.size * 0.6);
            const blockHeight =
                typeBlock.size + (typeBlock.lines.length - 1) * typeBlock.size * LINE_HEIGHT +
                lineSpacing +
                messageBlock.size + (messageBlock.lines.length - 1) * messageBlock.size * LINE_HEIGHT;
            return { typeBlock, messageBlock, lineSpacing, blockHeight };
        };

        let factor = 1;
        let layout = build(factor);
        while (layout.blockHeight > maxBlockHeight && factor > 0.1) {
            factor *= 0.9;
            layout = build(factor);
        }
        return layout;
    }

    private wrapText(
        ctx: CanvasRenderingContext2D,
        text: string,
        weight: number,
        desiredSize: number,
        family: string,
        maxWidth: number
    ): TextBlock {
        const setFont = (size: number) => { ctx.font = `${weight} ${size}px ${family}`; };
        const size = (() => {
            // Un mot seul plus large que la ligne ne peut pas être coupé : on réduit la police
            const fontSize = Math.max(MIN_FONT_SIZE, desiredSize);
            setFont(fontSize);
            const longestWord = Math.max(0, ...text.split(/\s+/).map(word => ctx.measureText(word).width));
            return longestWord > maxWidth
                ? Math.max(MIN_FONT_SIZE, Math.floor(fontSize * maxWidth / longestWord))
                : fontSize;
        })();

        setFont(size);
        const lines: string[] = [];
        for (const paragraph of text.split('\n')) {
            let current = '';
            for (const word of paragraph.split(/\s+/).filter(Boolean)) {
                const candidate = current ? `${current} ${word}` : word;
                if (!current || ctx.measureText(candidate).width <= maxWidth) {
                    current = candidate;
                } else {
                    lines.push(current);
                    current = word;
                }
            }
            if (current) lines.push(current);
        }
        return { lines: lines.length ? lines : [''], size };
    }

    private parseHex(color: string): { r: number; g: number; b: number } | null {
        const match = /^#([0-9a-f]{6})$/i.exec(color);
        if (!match) return null;
        const value = parseInt(match[1], 16);
        return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
    }

    private gradientColors(color: string): { solid: string; clear: string } {
        const rgb = this.parseHex(color);
        if (!rgb) {
            return { solid: 'rgba(0, 102, 204, 0.85)', clear: 'rgba(0, 102, 204, 0)' };
        }
        return { solid: color, clear: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)` };
    }

    /** Texte sombre sur les couleurs claires (jaune, vert, orange), blanc sinon. */
    private textColorFor(color: string): string {
        const rgb = this.parseHex(color);
        if (!rgb) return '#FFFFFF';
        const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        return luminance > 0.55 ? '#1F2937' : '#FFFFFF';
    }
}
