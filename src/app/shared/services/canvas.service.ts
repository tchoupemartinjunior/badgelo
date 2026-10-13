import { Injectable, inject } from '@angular/core';
import { EditorStateService } from '../../features/editor/state/editor-state.service';
import { TranslateService } from '@ngx-translate/core';
import { FrameSettings, Size, computePlacement, isRoundFrame } from '../utils/image-geometry';
import { LogoSettings } from '../../features/editor/logo-editor/logo-settings';
import { formatQuote } from '../../features/editor/badge-editor/quote-settings';
import { BADGE_FONTS, BadgeFont, BadgeFontId } from '../../features/editor/badge-editor/text-style';

/** Zone verticale occupée par le texte du badge, que le logo évite. */
interface Band {
    top: number;
    bottom: number;
}

/** Contenu imposé à `drawOverlay` (citation) : deux blocs, tailles en fraction de la largeur. */
interface OverlayContent {
    first: string;
    second: string;
    firstSize: number;
    secondSize: number;
}

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
        }
        return this.renderImage(previewUrl, canvas, this.drawOverlays.bind(this));
    }

    async renderImage(
        previewUrl: string,
        canvas: HTMLCanvasElement,
        overlay?: (ctx: CanvasRenderingContext2D, size: Size) => void | Promise<void>
    ): Promise<void> {
        if (!canvas) return;
        const img = await this.loadImage(previewUrl);
        const state = this.editorStateService.imageState();
        const imageSize: Size = { width: img.width, height: img.height };
        this.editorStateService.setImageSize(imageSize);

        // La taille du canvas dépend du format choisi ; la photo est recadrée pour le remplir
        const placement = computePlacement(imageSize, state.frame, state.transform);
        canvas.width = placement.frame.width;
        canvas.height = placement.frame.height;
        const ctx = canvas.getContext('2d')!;

        ctx.save();
        ctx.translate(canvas.width / 2 + placement.translateX, canvas.height / 2 + placement.translateY);
        ctx.rotate(placement.angle);
        ctx.scale(placement.scale * (state.transform.flipX ? -1 : 1), placement.scale);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();

        // Apply filters using pixel manipulation for better mobile support
        this.applyFilters(ctx, canvas);

        if (overlay) await overlay(ctx, { width: canvas.width, height: canvas.height });

        this.applyFrameShape(ctx, canvas, state.frame);
    }

    private cachedImage: { url: string; img: HTMLImageElement } | null = null;

    /** Évite de redécoder la photo à chaque modification d'un curseur. */
    private async loadImage(url: string): Promise<HTMLImageElement> {
        if (this.cachedImage?.url === url) return this.cachedImage.img;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load image'));
        });
        this.cachedImage = { url, img };
        return img;
    }

    /** Découpe l'image finale en rond ou en carré arrondi ; les coins deviennent transparents. */
    private applyFrameShape(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, frame: FrameSettings): void {
        const round = isRoundFrame(frame);
        if (!round && frame.shape !== 'rounded') return;

        const { width, height } = canvas;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-in';
        ctx.beginPath();
        if (round) {
            ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
        } else {
            const radius = Math.round(Math.min(width, height) * 0.08);
            ctx.moveTo(radius, 0);
            ctx.arcTo(width, 0, width, height, radius);
            ctx.arcTo(width, height, 0, height, radius);
            ctx.arcTo(0, height, 0, 0, radius);
            ctx.arcTo(0, 0, width, 0, radius);
            ctx.closePath();
        }
        ctx.fill();
        ctx.restore();
    }

    private applyFilters(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
        const brightness = this.editorStateService.brightness();
        const contrast = this.editorStateService.contrast();
        const saturation = this.editorStateService.saturation();

        const filter = this.editorStateService.filter();

        // Skip if all values are at default (100)
        if (brightness === 100 && contrast === 100 && saturation === 100 && filter === 'none') {
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

            if (filter === 'bw') {
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                r = g = b = gray;
            } else if (filter === 'sepia') {
                const sr = 0.393 * r + 0.769 * g + 0.189 * b;
                const sg = 0.349 * r + 0.686 * g + 0.168 * b;
                const sb = 0.272 * r + 0.534 * g + 0.131 * b;
                r = Math.min(255, sr);
                g = Math.min(255, sg);
                b = Math.min(255, sb);
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
        size: Size,
        content?: OverlayContent
    ): Band {

        const width = size.width;
        const height = size.height;

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
            ctx, content?.first ?? typeLine, content?.second ?? messageLine, font,
            Math.round(width * (content?.firstSize ?? 0.09) * scale), Math.round(width * (content?.secondSize ?? 0.07) * scale),
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
        const x = this.textX(style.align, width, sidePadding);
        this.drawTextBlocks(ctx, { typeBlock, messageBlock, lineSpacing }, font, x, blockBottom, style.align, this.textColorFor(badgeColor));
        this.drawSmallWatermark(ctx, size);

        return {
            top: Math.max(0, blockBottom - blockHeight - edgePadding),
            bottom: Math.min(height, blockBottom + edgePadding),
        };
    }

    private textX(align: CanvasTextAlign, width: number, padding: number): number {
        return align === 'left' ? padding : align === 'right' ? width - padding : width / 2;
    }

    /** Les lignes sont posées de bas en haut : message, puis premier bloc (type de badge ou citation). */
    private drawTextBlocks(
        ctx: CanvasRenderingContext2D,
        layout: { typeBlock: TextBlock; messageBlock: TextBlock; lineSpacing: number },
        font: BadgeFont,
        x: number,
        blockBottom: number,
        align: CanvasTextAlign,
        color: string
    ): void {
        const { typeBlock, messageBlock, lineSpacing } = layout;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = 'bottom';

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
    }

    private drawSmallWatermark(ctx: CanvasRenderingContext2D, size: Size): void {
        ctx.save();
        ctx.font = `400 ${Math.round(size.width * 0.02)}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Badgelo', size.width - 10, size.height - 10);
        ctx.restore();
    }

    /** Badge « Citation » : guillemets, auteur, et la photo importée comme portrait. */
    private drawQuote(ctx: CanvasRenderingContext2D, size: Size): Band {
        const state = this.editorStateService;
        const quote = state.quote();
        const text = formatQuote(
            state.badgeText().trim() || this.translateService.instant('BADGE_EDITOR.QUOTE.PREVIEW_QUOTE'),
            quote.marks
        );
        const author = quote.author.trim() || this.translateService.instant('BADGE_EDITOR.QUOTE.PREVIEW_AUTHOR');
        const role = quote.role.trim();
        const attribution = role ? `\u2014 ${author}\n${role}` : `\u2014 ${author}`;

        const style = state.textStyle();
        const font = this.findFont(style.font);
        const scale = style.size / 100;
        const color = state.badgeColor();
        const { width, height } = size;

        if (quote.layout === 'band') {
            return this.drawOverlay(ctx, size, { first: text, second: attribution, firstSize: 0.075, secondSize: 0.045 });
        }

        if (quote.layout === 'card') {
            const snapshot = document.createElement('canvas');
            snapshot.width = ctx.canvas.width;
            snapshot.height = ctx.canvas.height;
            snapshot.getContext('2d')?.drawImage(ctx.canvas, 0, 0);

            const pad = Math.round(Math.min(width, height) * 0.07);
            const diameter = Math.round(Math.min(width, height) * 0.32);
            const cx = width / 2;
            const cy = pad + diameter / 2;
            const textColor = this.textColorFor(color);

            ctx.save();
            ctx.fillStyle = color || '#0f766e';
            ctx.fillRect(0, 0, width, height);
            const side = Math.min(snapshot.width, snapshot.height);
            ctx.beginPath();
            ctx.arc(cx, cy, diameter / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(
                snapshot,
                (snapshot.width - side) / 2, (snapshot.height - side) * 0.35, side, side,
                cx - diameter / 2, cy - diameter / 2, diameter, diameter
            );
            ctx.restore();

            ctx.save();
            ctx.lineWidth = Math.max(2, diameter * 0.035);
            ctx.strokeStyle = textColor;
            ctx.beginPath();
            ctx.arc(cx, cy, diameter / 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            const top = cy + diameter / 2 + pad;
            const available = Math.max(0, height - pad - top);
            const layout = this.layoutBadgeText(
                ctx, text, attribution, font,
                Math.round(width * 0.075 * scale), Math.round(width * 0.045 * scale),
                width - pad * 2, available
            );
            const blockBottom = top + (available + layout.blockHeight) / 2;
            this.drawTextBlocks(ctx, layout, font, width / 2, blockBottom, 'center', textColor);
            this.drawSmallWatermark(ctx, size);
            return { top: Math.max(0, blockBottom - layout.blockHeight - pad / 2), bottom: Math.min(height, blockBottom + pad / 2) };
        }

        // Plein cadre : la photo reste visible sous un voile teinté, le texte est centré
        const rgb = this.parseHex(color);
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.55)` : 'rgba(0, 102, 204, 0.55)';
        ctx.fillRect(0, 0, width, height);
        ctx.restore();

        const pad = Math.round(width * 0.1);
        const layout = this.layoutBadgeText(
            ctx, text, attribution, font,
            Math.round(width * 0.085 * scale), Math.round(width * 0.05 * scale),
            width - pad * 2, height - pad * 2
        );
        const blockBottom = (height + layout.blockHeight) / 2;
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = Math.round(width * 0.012);
        this.drawTextBlocks(ctx, layout, font, this.textX(style.align, width, pad), blockBottom, style.align, '#FFFFFF');
        ctx.restore();
        this.drawSmallWatermark(ctx, size);
        return { top: Math.max(0, blockBottom - layout.blockHeight - pad / 3), bottom: Math.min(height, blockBottom + pad / 3) };
    }

    /** Filigrane, badge puis logo, dans cet ordre : le logo reste toujours lisible. */
    private async drawOverlays(ctx: CanvasRenderingContext2D, size: Size): Promise<void> {
        const state = this.editorStateService.imageState();
        const isQuote = this.editorStateService.hasBadge() && this.editorStateService.isQuote();
        // La carte repeint toute l'image : le filigrane doit venir après
        const watermarkLast = isQuote && this.editorStateService.quote().layout === 'card';
        if (state.watermark && !watermarkLast) this.drawDiagonalWatermark(ctx, size);
        const occupied = !this.editorStateService.hasBadge()
            ? null
            : isQuote ? this.drawQuote(ctx, size) : this.drawOverlay(ctx, size);
        if (state.watermark && watermarkLast) this.drawDiagonalWatermark(ctx, size);
        if (state.logo.url) await this.drawLogo(ctx, size, state.logo, occupied);
    }

    private drawDiagonalWatermark(ctx: CanvasRenderingContext2D, size: Size): void {
        const text = 'Badgelo';
        const fontSize = Math.max(14, Math.round(size.width * 0.045));

        ctx.save();
        ctx.font = `600 ${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = Math.round(fontSize * 0.15);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const stepX = ctx.measureText(text).width * 2.6;
        const stepY = fontSize * 4;
        const reach = Math.hypot(size.width, size.height) / 2;

        ctx.translate(size.width / 2, size.height / 2);
        ctx.rotate(-Math.PI / 6);
        let row = 0;
        for (let y = -reach; y <= reach; y += stepY, row++) {
            const offset = row % 2 ? stepX / 2 : 0;
            for (let x = -reach + offset; x <= reach; x += stepX) {
                ctx.fillText(text, x, y);
            }
        }
        ctx.restore();
    }

    private async drawLogo(
        ctx: CanvasRenderingContext2D,
        size: Size,
        logo: LogoSettings,
        occupied: Band | null
    ): Promise<void> {
        if (!logo.url) return;
        let img: HTMLImageElement;
        try {
            img = await this.loadLogo(logo.url);
        } catch {
            return;
        }

        const row = logo.position[0];
        const col = logo.position[1];
        // Dans un cadre rond, les coins sont rognés : le logo rentre dans le cercle
        const roundCorner = isRoundFrame(this.editorStateService.frame()) && row !== 'm' && col !== 'c';
        const margin = Math.round(size.width * (roundCorner ? 0.15 : 0.03));

        let width = Math.round(size.width * logo.size / 100);
        let height = Math.round(width * img.height / img.width);
        const maxHeight = Math.round(size.height * 0.4);
        if (height > maxHeight) {
            height = maxHeight;
            width = Math.round(height * img.width / img.height);
        }

        const x = col === 'l' ? margin : col === 'r' ? size.width - margin - width : (size.width - width) / 2;
        let y = row === 't' ? margin : row === 'b' ? size.height - margin - height : (size.height - height) / 2;

        // Le logo se place au-dessus ou en dessous du texte du badge, jamais dessus
        if (occupied && row !== 'm' && y < occupied.bottom && y + height > occupied.top) {
            y = row === 't' ? occupied.bottom : occupied.top - height;
        }
        y = Math.min(Math.max(0, y), size.height - height);

        ctx.save();
        ctx.globalAlpha = logo.opacity / 100;
        ctx.drawImage(img, x, y, width, height);
        ctx.restore();
    }

    private cachedLogo: { url: string; img: HTMLImageElement } | null = null;

    private async loadLogo(url: string): Promise<HTMLImageElement> {
        if (this.cachedLogo?.url === url) return this.cachedLogo.img;
        const img = new Image();
        img.src = url;
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load logo'));
        });
        this.cachedLogo = { url, img };
        return img;
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
            const longestWord = Math.max(0, ...text.split(/[ \t\n]+/).map(word => ctx.measureText(word).width));
            return longestWord > maxWidth
                ? Math.max(MIN_FONT_SIZE, Math.floor(fontSize * maxWidth / longestWord))
                : fontSize;
        })();

        setFont(size);
        const lines: string[] = [];
        for (const paragraph of text.split('\n')) {
            let current = '';
            for (const word of paragraph.split(/[ \t]+/).filter(Boolean)) {
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
