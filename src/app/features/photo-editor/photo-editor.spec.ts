import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhotoEditor } from './photo-editor';

describe('PhotoEditor', () => {
  let component: PhotoEditor;
  let fixture: ComponentFixture<PhotoEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhotoEditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhotoEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
