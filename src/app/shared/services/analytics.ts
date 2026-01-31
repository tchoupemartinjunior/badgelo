import { Injectable } from '@angular/core';

declare let gtag: Function;
@Injectable({
  providedIn: 'root',
})
export class Analytics {
  track(event: string, params: Record<string, any> = {}) {
    gtag('event', event, params);
  }
}
