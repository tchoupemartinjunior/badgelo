import { Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FileService } from '@shared/services/file.service';

@Component({
  selector: 'bdge-home',
  imports: [TranslateModule, RouterLink, NgOptimizedImage],
  templateUrl: './home.html'
})
export class Home {
  router = inject(Router);
  fileService = inject(FileService);

  readonly perks = ['HOME.PERKS.NO_ACCOUNT', 'HOME.PERKS.PRIVATE', 'HOME.PERKS.HD'];

  readonly showcase = [
    { key: 'badges', tone: 'bg-purple-100 text-purple-700', icon: 'M12 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM8.5 13L7 22l5-3 5 3-1.5-9', titleKey: 'HOME.SHOWCASE.ITEMS.BADGES.TITLE', descKey: 'HOME.SHOWCASE.ITEMS.BADGES.DESC' },
    { key: 'quotes', tone: 'bg-orange-100 text-orange-800', icon: 'M7 7h4v4c0 3-2 5-4 5M15 7h4v4c0 3-2 5-4 5', titleKey: 'HOME.SHOWCASE.ITEMS.QUOTES.TITLE', descKey: 'HOME.SHOWCASE.ITEMS.QUOTES.DESC' },
    { key: 'framing', tone: 'bg-blue-100 text-blue-700', icon: 'M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2', titleKey: 'HOME.SHOWCASE.ITEMS.FRAMING.TITLE', descKey: 'HOME.SHOWCASE.ITEMS.FRAMING.DESC' },
    { key: 'logo', tone: 'bg-green-100 text-green-700', icon: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 8a1 1 0 1 0 0 .01M21 15l-5-5L5 21', titleKey: 'HOME.SHOWCASE.ITEMS.LOGO.TITLE', descKey: 'HOME.SHOWCASE.ITEMS.LOGO.DESC' }
  ];

  readonly steps = [
    { num: 1, titleKey: 'HOME.STEPS.ITEMS.IMPORT.TITLE', descKey: 'HOME.STEPS.ITEMS.IMPORT.DESC' },
    { num: 2, titleKey: 'HOME.STEPS.ITEMS.CUSTOMIZE.TITLE', descKey: 'HOME.STEPS.ITEMS.CUSTOMIZE.DESC' },
    { num: 3, titleKey: 'HOME.STEPS.ITEMS.DOWNLOAD.TITLE', descKey: 'HOME.STEPS.ITEMS.DOWNLOAD.DESC' }
  ];

  targets = [
    { key: 'organizers', emoji: '🎤', tone: 'bg-purple-100', titleKey: 'HOME.TARGETS.ITEMS.ORGANIZERS.TITLE', descKey: 'HOME.TARGETS.ITEMS.ORGANIZERS.DESC' },
    { key: 'marketers', emoji: '📣', tone: 'bg-orange-100', titleKey: 'HOME.TARGETS.ITEMS.MARKETERS.TITLE', descKey: 'HOME.TARGETS.ITEMS.MARKETERS.DESC' },
    { key: 'volunteers', emoji: '🤝', tone: 'bg-green-100', titleKey: 'HOME.TARGETS.ITEMS.VOLUNTEERS.TITLE', descKey: 'HOME.TARGETS.ITEMS.VOLUNTEERS.DESC' }
  ];

  testimonials = [
    { quoteKey: 'HOME.TESTIMONIALS.QUOTE1.TEXT', author: 'Stephanie — Event Organizer' },
    { quoteKey: 'HOME.TESTIMONIALS.QUOTE2.TEXT', author: 'Marc — Community Manager' }
  ];

  onFileSelected($event: File) {
    this.fileService.upload($event);
    this.router.navigate(['/editor']);
  }

  onFileSelectedButton() {
    // open file uploader component programmatically by navigating to editor where uploader is present
    this.router.navigate(['/editor']);
  }

}
