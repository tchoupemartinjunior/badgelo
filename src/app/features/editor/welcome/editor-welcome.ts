import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FileService } from '@shared/services/file.service';

/** Écran affiché tant qu'aucune photo n'est importée. */
@Component({
  selector: 'bdge-editor-welcome',
  imports: [TranslateModule],
  templateUrl: './editor-welcome.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorWelcome {
  private readonly fileService = inject(FileService);

  /** Vrai pendant qu'un fichier est glissé au-dessus de la page : la zone de dépôt se met en évidence. */
  dragging = input<boolean>(false);

  readonly features = [
    'EDITOR_WELCOME.PILL_BADGES',
    'EDITOR_WELCOME.PILL_QUOTES',
    'EDITOR_WELCOME.PILL_FRAMING',
  ];

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.fileService.upload(file);
    input.value = '';
  }
}
