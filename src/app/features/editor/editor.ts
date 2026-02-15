import { Component, inject, ViewChild, ElementRef, TemplateRef, AfterViewInit, effect } from '@angular/core';
import { FileService } from '../../shared/services/file.service';
import { UploadButton } from "@shared/components/upload-button/upload-button";
import { Preview } from "../preview/preview";
import { NgClass } from '@angular/common';
import { ButtonComponent } from "@shared/components/button/button";
import { EditorStateService } from './state/editor-state.service';
import { PhotoEditor } from './photo-editor/photo-editor';
import { BadgeEditor } from "./badge-editor/badge-editor";
import { OnInit } from '@angular/core';
import { CanvasService } from '../../shared/services/canvas.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'bdge-editor',
  imports: [UploadButton, TranslateModule, Preview, NgClass, PhotoEditor, ButtonComponent, BadgeEditor],
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
})

export class Editor implements AfterViewInit {

  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  fileService = inject(FileService);
  editorStateService = inject(EditorStateService);
  canvasService = inject(CanvasService);

  activeTab: string = 'badge';

  tabs = [
    { key: 'badge', label: 'EDITOR.TABS.BADGE', index: 0 },
    { key: 'photo', label: 'EDITOR.TABS.PHOTO', index: 1 }

  ];

  constructor() {
    effect(() => {
      this.editorStateService.hasChanges();
      this.editorStateService.badgeText();
      this.editorStateService.badgeType();
      this.canvasService.drawImageToCanvas(this.fileService.previewUrl());
    });
  }


  ngAfterViewInit() {
    if (!this.canvas) return;
    this.editorStateService.setCanvas(this.canvas.nativeElement);
  }

}

