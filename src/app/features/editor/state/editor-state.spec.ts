import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Analytics } from '@shared/services/analytics';

import { DEFAULT_TEXT_STYLE, TEXT_SIZE_MAX, TEXT_SIZE_MIN } from '../badge-editor/text-style';
import { EditorStateService } from './editor-state.service';

describe('EditorStateService', () => {
  let service: EditorStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService(), { provide: Analytics, useValue: { track: () => undefined } }],
    });
    service = TestBed.inject(EditorStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('starts with the default text style', () => {
    expect(service.textStyle()).toEqual(DEFAULT_TEXT_STYLE);
  });

  it('updates font, alignment and position independently', () => {
    service.setTextFont('elegant');
    service.setTextAlign('left');
    service.setTextPosition('top');

    expect(service.textStyle()).toEqual({ font: 'elegant', size: 100, align: 'left', position: 'top' });
  });

  it('keeps the text size within the allowed range', () => {
    service.setTextSize(500);
    expect(service.textStyle().size).toBe(TEXT_SIZE_MAX);

    service.setTextSize(1);
    expect(service.textStyle().size).toBe(TEXT_SIZE_MIN);
  });

  it('restores the default text style on reset', () => {
    service.setTextFont('festive');
    service.setTextSize(140);

    service.resetEditor();

    expect(service.textStyle()).toEqual(DEFAULT_TEXT_STYLE);
  });

  it('builds the quote settings and creates the badge on first edit', () => {
    service.setQuoteAuthor('Awa Ndiaye');
    service.setQuoteLayout('card');
    service.setQuoteMarks('curly');

    expect(service.quote()).toEqual({ author: 'Awa Ndiaye', role: '', marks: 'curly', layout: 'card' });
    expect(service.hasBadge()).toBe(true);
  });
});
