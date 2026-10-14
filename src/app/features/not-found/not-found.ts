import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'bdge-not-found',
  imports: [RouterLink, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-xl px-6 py-24 text-center">
      <p class="mb-2 text-6xl font-bold text-purple-700" aria-hidden="true">404</p>
      <h1 class="mb-3 text-2xl font-bold text-gray-900">{{ 'NOT_FOUND.TITLE' | translate }}</h1>
      <p class="mb-8 text-gray-700">{{ 'NOT_FOUND.DESCRIPTION' | translate }}</p>
      <a routerLink="/home"
        class="inline-block rounded-lg bg-purple-700 px-6 py-3 font-medium text-white hover:bg-purple-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700">
        {{ 'NOT_FOUND.BACK_HOME' | translate }}
      </a>
    </main>
  `,
})
export class NotFound {}
