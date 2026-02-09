import { Component, inject } from '@angular/core';
import { RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'bdge-navbar',
  imports: [RouterLink, TranslateModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  translateService = inject(TranslateService);
  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
  onLanguageChange($event: Event) {
    const selectElement = $event.target as HTMLSelectElement;
    const selectedLanguage = selectElement.value;
    this.translateService.use(selectedLanguage);
  }
}
