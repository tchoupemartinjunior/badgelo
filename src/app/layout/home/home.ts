import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FileUploader } from "@shared/components/file-uploader/file-uploader";
import { FileService } from '@shared/services/file.service';

@Component({
  selector: 'bdge-home',
  imports: [FileUploader, TranslateModule],
  templateUrl: './home.html'
})
export class Home {
  router = inject(Router);
  fileService = inject(FileService);

  features = [
    { titleKey: 'HOME.FEATURES.ITEMS.FAST.TITLE', descKey: 'HOME.FEATURES.ITEMS.FAST.DESC' },
    { titleKey: 'HOME.FEATURES.ITEMS.CUSTOM.TITLE', descKey: 'HOME.FEATURES.ITEMS.CUSTOM.DESC' },
    { titleKey: 'HOME.FEATURES.ITEMS.SHARE.TITLE', descKey: 'HOME.FEATURES.ITEMS.SHARE.DESC' }
  ];

  targets = [
    { key: 'organizers', titleKey: 'HOME.TARGETS.ITEMS.ORGANIZERS.TITLE', descKey: 'HOME.TARGETS.ITEMS.ORGANIZERS.DESC' },
    { key: 'marketers', titleKey: 'HOME.TARGETS.ITEMS.MARKETERS.TITLE', descKey: 'HOME.TARGETS.ITEMS.MARKETERS.DESC' },
    { key: 'volunteers', titleKey: 'HOME.TARGETS.ITEMS.VOLUNTEERS.TITLE', descKey: 'HOME.TARGETS.ITEMS.VOLUNTEERS.DESC' }
  ];

  testimonials = [
    { quoteKey: 'HOME.TESTIMONIALS.QUOTE1.TEXT', author: 'Alice — Event Organizer' },
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
