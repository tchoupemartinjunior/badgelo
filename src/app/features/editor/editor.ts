import { Component, inject, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { FileService } from '../../shared/services/file.service';
import { UploadButton } from "@shared/components/upload-button/upload-button";
import { Preview } from "../preview/preview";
import { NgClass } from '@angular/common';
import { ButtonComponent } from "@shared/components/button/button";
import { EditorStateService } from './state/editor-state.service';
import { PhotoEditor } from './photo-editor/photo-editor';
import { BadgeEditor } from "./badge-editor/badge-editor";

@Component({
  selector: 'bdge-editor',
  imports: [UploadButton, Preview, NgClass, PhotoEditor, ButtonComponent, BadgeEditor],
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
})

export class Editor {

  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  fileService = inject(FileService);
  editorStateService = inject(EditorStateService);

  activeTab: string = 'photo';

  tabs = [
    { key: 'photo', label: 'Edition Photo' },
    { key: 'badge', label: 'Badge' }
  ];

}

