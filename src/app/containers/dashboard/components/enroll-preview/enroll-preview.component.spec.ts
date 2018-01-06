import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnrollPreviewComponent } from './enroll-preview.component';

describe('EnrollPreviewComponent', () => {
  let component: EnrollPreviewComponent;
  let fixture: ComponentFixture<EnrollPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EnrollPreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnrollPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
