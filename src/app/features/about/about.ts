import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'bdge-about',
  imports: [RouterLink, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-3xl px-6 py-16">
      <h1 class="mb-4 text-3xl font-bold text-gray-900">{{ 'ABOUT.TITLE' | translate }}</h1>
      <p class="mb-8 text-lg text-gray-700">{{ 'ABOUT.DESCRIPTION' | translate }}</p>
      <a routerLink="/editor"
        class="inline-block rounded-lg bg-purple-700 px-6 py-3 font-medium text-white hover:bg-purple-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700">
        {{ 'HOME.CTA_BUTTON' | translate }}
      </a>
    </main>
  `,
})
export class About {}
