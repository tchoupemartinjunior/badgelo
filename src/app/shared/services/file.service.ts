import { inject, Injectable, signal, OnDestroy } from '@angular/core';
import { EditorStateService } from '../../features/editor/state/editor-state.service';
import { CanvasService } from './canvas.service';
import { Analytics } from './analytics';


export type ExportFormat = 'png' | 'jpeg';
export const EXPORT_SIZES = [null, 2048, 1080] as const;

const MIME: Record<ExportFormat, 'image/png' | 'image/jpeg'> = { png: 'image/png', jpeg: 'image/jpeg' };
const JPEG_QUALITY = 0.92;

@Injectable({
    providedIn: 'root'
})
export class FileService implements OnDestroy {
    editorStateService = inject(EditorStateService);
    canvasService = inject(CanvasService);
    analyticsService = inject(Analytics);

    private _uploadedFile = signal<File | null>(null);
    private _previewUrl = signal<string | null>(null);
    private placeholderImageUrl = signal<string | null>('../../../assets/images/landscape-placeholder.svg');

    readonly exportFormat = signal<ExportFormat>('png');
    /** Plus grand côté de l'image exportée en px ; `null` = taille d'origine. */
    readonly exportMaxSize = signal<number | null>(null);
    readonly downloading = signal(false);
    /** Clé de traduction du dernier message d'erreur d'export, `null` si tout va bien. */
    readonly downloadError = signal<string | null>(null);

    readonly previewUrl = this._previewUrl.asReadonly();
    readonly uploadedFile = this._uploadedFile.asReadonly();
    readonly placeholderUrl = this.placeholderImageUrl.asReadonly();

    getUploadedFile() {
        return this.uploadedFile();
    }

    upload(file: File): void {
        this.revokePreviewUrl();
        this._uploadedFile.set(file);
        this._previewUrl.set(URL.createObjectURL(file));
        this.downloadError.set(null);
        this.canvasService.drawImageToCanvas(this.previewUrl());
        this.editorStateService.resetEditor();
        this.editorStateService.clearHistory();
        this.editorStateService.setImageSize(null);
        this.analyticsService.track('upload_image', {
            event_category: 'file_management',
            event_label: 'image_upload'
        });
    }


    ngOnDestroy(): void {
        this.revokePreviewUrl();
    }

    private revokePreviewUrl(): void {
        const url = this._previewUrl();
        if (url) URL.revokeObjectURL(url);
    }

    /** Nom du fichier exporté : celui de la photo d'origine, suffixé « -badgelo ». */
    exportFilename(format: ExportFormat = this.exportFormat()): string {
        const original = this._uploadedFile()?.name ?? '';
        const base = original.replace(/\.[^./\\]+$/, '').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'image';
        return `${base}-badgelo.${format === 'jpeg' ? 'jpg' : 'png'}`;
    }

    async download(): Promise<void> {
        const previewUrl = this.previewUrl();
        const canvas = this.editorStateService.canvas();
        if (!previewUrl || !canvas || this.downloading()) return;

        this.downloading.set(true);
        this.downloadError.set(null);
        try {
            const format = this.exportFormat();
            const blob = await this.canvasService.exportBlob(previewUrl, canvas, {
                type: MIME[format],
                quality: format === 'jpeg' ? JPEG_QUALITY : undefined,
                maxSize: this.exportMaxSize(),
            });
            const file = new File([blob], this.exportFilename(format), { type: blob.type });
            const method = await this.deliver(file);
            if (method === 'cancelled') return;
            this.analyticsService.track('download_image', {
                event_category: 'file_management',
                event_label: 'image_download',
                method,
                format,
            });
        } catch {
            this.downloadError.set('EDITOR.DOWNLOAD_ERROR');
        } finally {
            this.downloading.set(false);
        }
    }

    /** Partage natif (feuille de partage iOS/Android) si possible, sinon téléchargement classique. */
    private async deliver(file: File): Promise<'share' | 'download' | 'cancelled'> {
        const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
        const isTouch = navigator.maxTouchPoints > 0;
        if (isTouch && typeof nav.share === 'function' && nav.canShare?.({ files: [file] })) {
            try {
                await nav.share({ files: [file] });
                return 'share';
            } catch (error) {
                if ((error as DOMException)?.name === 'AbortError') return 'cancelled';
                // geste utilisateur expiré ou partage refusé : repli sur le téléchargement
            }
        }
        this.saveWithLink(file);
        return 'download';
    }

    private saveWithLink(file: File): void {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);

        // iOS Safari ≥ 13 honore l'attribut download sur les liens blob ; en dernier recours
        // (navigateur sans support), l'image s'ouvre dans un onglet pour un appui long.
        if ('download' in HTMLAnchorElement.prototype) {
            link.click();
        } else {
            window.open(url, '_blank');
        }

        setTimeout(() => {
            URL.revokeObjectURL(url);
            link.remove();
        }, 60_000);
    }
}
