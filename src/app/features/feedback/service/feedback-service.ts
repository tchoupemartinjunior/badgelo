import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';

export interface FeedbackFormValue {
  name: string;
  email: string;
  subject: string;
  message: string;
  rating: string;
}

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  // URL complète du Google Form 
  // Format: https://docs.google.com/forms/d/e/{FORM_ID}/formResponse
  private readonly GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSczisr0qyJRfp6-e6Rfks3C5ebmgOuqHklS3EE8311oBHfKbg/formResponse';

  private readonly FORM_FIELD_MAPPING = {
    name: 'entry.738988985',
    email: 'entry.1925440459',
    subject: 'entry.983658289',
    message: 'entry.200538582',
    rating: 'entry.1622607962',
  };

  sendToGoogleForm(data: FeedbackFormValue): Observable<any> {
    return from(this.sendFormData(data));
  }

  private async sendFormData(data: FeedbackFormValue): Promise<Response> {
    const params = new URLSearchParams();

    // Map form values to Google Form entry fields
    Object.entries(this.FORM_FIELD_MAPPING).forEach(([key, fieldId]) => {
      const value = data[key as keyof FeedbackFormValue];
      if (value) {
        params.append(fieldId, value);
      }
    });

    // Construire l'URL avec les paramètres
    const url = `${this.GOOGLE_FORM_URL}?${params.toString()}`;

    // Utiliser fetch() avec mode: 'no-cors' pour contourner les problèmes CORS
    const response = await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
    });

    return response;
  }
}
