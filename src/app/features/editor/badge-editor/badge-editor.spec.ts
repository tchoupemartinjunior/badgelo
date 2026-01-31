import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgeEditor } from './badge-editor';

describe('BadgeEditor', () => {
  let component: BadgeEditor;
  let fixture: ComponentFixture<BadgeEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeEditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgeEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
