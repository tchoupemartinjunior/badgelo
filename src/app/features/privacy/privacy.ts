import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'bdge-privacy',
  imports: [RouterLink, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy.html',
})
export class Privacy {
  readonly sections = ['PHOTOS', 'ANALYTICS', 'FEEDBACK', 'RIGHTS', 'CONTROLLER'] as const;
}
