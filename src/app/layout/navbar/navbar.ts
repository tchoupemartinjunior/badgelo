import { Component, inject } from '@angular/core';
import { RouterLink } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { SHARED_MODULES } from "@shared/shared";

@Component({
  selector: 'bdge-navbar',
  imports: [RouterLink, SHARED_MODULES],
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
