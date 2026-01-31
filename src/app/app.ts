import { Component, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Header } from "@layout/header/header";
import { Navbar } from "@layout/navbar/navbar";
import { Footer } from "@layout/footer/footer";
import { filter } from 'rxjs/operators';

declare let gtag: Function;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('badgelo');

  constructor(router: Router) {
    router.events
      .pipe(filter((event: any) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        gtag('config', 'G-N4MMFW00MS', {
          page_path: event.urlAfterRedirects
        });
      });
  }
}
