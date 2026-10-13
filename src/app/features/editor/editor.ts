import { Component, inject, ViewChild, ElementRef, TemplateRef, AfterViewInit, effect, signal } from '@angular/core';
import { FileService } from '../../shared/services/file.service';
import { UploadButton } from "@shared/components/upload-button/upload-button";
import { Preview } from "../preview/preview";
import { NgClass } from '@angular/common';
import { ButtonComponent } from "@shared/components/button/button";
import { EditorStateService } from './state/editor-state.service';
import { PhotoEditor } from './photo-editor/photo-editor';
import { BadgeEditor } from "./badge-editor/badge-editor";
import { EditorWelcome } from './welcome/editor-welcome';
import { LogoEditor } from './logo-editor/logo-editor';
import { OnInit } from '@angular/core';
import { CanvasService } from '../../shared/services/canvas.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'bdge-editor',
  imports: [UploadButton, TranslateModule, Preview, NgClass, PhotoEditor, ButtonComponent, BadgeEditor, EditorWelcome, LogoEditor],
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
  host: {
    '(window:keydown)': 'onKeydown($event)',
    '(window:dragover)': 'onDragOver($event)',
    '(window:dragleave)': 'onDragLeave($event)',
    '(window:drop)': 'onDrop($event)',
  },
})

export class Editor implements AfterViewInit {

  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  fileService = inject(FileService);
  editorStateService = inject(EditorStateService);
  canvasService = inject(CanvasService);

  activeTab: string = 'badge';

  tabs = [
    { key: 'badge', label: 'EDITOR.TABS.BADGE', index: 0 },
    { key: 'photo', label: 'EDITOR.TABS.PHOTO', index: 1 },
    { key: 'logo', label: 'EDITOR.TABS.LOGO', index: 2 }

  ];

  constructor() {
    effect(() => {
      // Suivre tout l'état de l'éditeur (filtres, badge, style du texte...)
      // pour redessiner le canvas à chaque modification.
      this.editorStateService.imageState();
      this.canvasService.drawImageToCanvas(this.fileService.previewUrl());
    });
  }


  /** Vrai pendant qu'un fichier est glissé au-dessus de la page. */
  readonly dragging = signal(false);

  onDragOver(event: DragEvent) {
    if (!this.hasFiles(event)) return;
    event.preventDefault();
    this.dragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    if (event.relatedTarget === null) this.dragging.set(false);
  }

  /** Une photo déposée n'importe où sur la page est importée. */
  onDrop(event: DragEvent) {
    if (!this.hasFiles(event)) return;
    event.preventDefault();
    this.dragging.set(false);
    const photo = Array.from(event.dataTransfer?.files ?? []).find(file => file.type.startsWith('image/'));
    if (photo) this.fileService.upload(photo);
  }

  private hasFiles(event: DragEvent): boolean {
    return event.dataTransfer?.types.includes('Files') ?? false;
  }

  private drag: { startX: number; startY: number; offsetX: number; offsetY: number } | null = null;

  onPointerDown(event: PointerEvent) {
    const { offsetX, offsetY } = this.editorStateService.transform();
    this.canvas.nativeElement.setPointerCapture(event.pointerId);
    this.drag = { startX: event.clientX, startY: event.clientY, offsetX, offsetY };
  }

  /** Déplace la photo dans le cadre en suivant le pointeur. */
  onPointerMove(event: PointerEvent) {
    if (!this.drag) return;
    const canvas = this.canvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    // pixels affichés par pixel du canvas (le canvas est ajusté avec object-contain)
    const displayScale = Math.min(rect.width / canvas.width, rect.height / canvas.height);
    if (!displayScale) return;
    this.editorStateService.setPan(
      this.drag.offsetX + (event.clientX - this.drag.startX) / displayScale / canvas.width,
      this.drag.offsetY + (event.clientY - this.drag.startY) / displayScale / canvas.height,
    );
  }

  onPointerEnd() {
    this.drag = null;
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    const { zoom } = this.editorStateService.transform();
    this.editorStateService.setZoom(zoom + (event.deltaY < 0 ? 5 : -5));
  }

  onKeydown(event: KeyboardEvent) {
    if (!(event.ctrlKey || event.metaKey) || this.isTypingTarget(event.target)) return;
    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.editorStateService.undo();
    } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
      event.preventDefault();
      this.editorStateService.redo();
    }
  }

  /** Dans un champ de saisie, Ctrl+Z reste l'annulation du texte ; les curseurs, eux, passent à l'éditeur. */
  private isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    if (target instanceof HTMLInputElement) return target.type !== 'range';
    return target.isContentEditable || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
  }

  ngAfterViewInit() {
    if (!this.canvas) return;
    this.editorStateService.setCanvas(this.canvas.nativeElement);
  }

}

