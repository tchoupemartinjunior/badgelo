import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SliderComponent } from '@shared/components/slider/slider';
import { EditorStateService } from '../state/editor-state.service';
import {
  LOGO_OPACITY_MAX,
  LOGO_OPACITY_MIN,
  LOGO_POSITIONS,
  LOGO_SIZE_MAX,
  LOGO_SIZE_MIN,
} from './logo-settings';

@Component({
  selector: 'bdge-logo-editor',
  imports: [TranslateModule, SliderComponent],
  templateUrl: './logo-editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoEditor {
  readonly editorStateService = inject(EditorStateService);
  readonly logo = this.editorStateService.logo;
  readonly watermark = this.editorStateService.watermark;

  readonly positions = LOGO_POSITIONS;
  readonly sizeMin = LOGO_SIZE_MIN;
  readonly sizeMax = LOGO_SIZE_MAX;
  readonly opacityMin = LOGO_OPACITY_MIN;
  readonly opacityMax = LOGO_OPACITY_MAX;

  /** Damier derrière la vignette, pour deviner la transparence d'un PNG. */
  readonly checkerboard = 'conic-gradient(#e5e7eb 25%, #fff 0 50%, #e5e7eb 0 75%, #fff 0) 0 0 / 12px 12px';

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file?.type.startsWith('image/')) {
      this.editorStateService.setLogo(URL.createObjectURL(file), file.name);
    }
    input.value = '';
  }

  onWatermarkChange(event: Event) {
    this.editorStateService.setWatermark((event.target as HTMLInputElement).checked);
  }
}
