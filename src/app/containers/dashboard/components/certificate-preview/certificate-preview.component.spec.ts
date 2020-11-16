import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CertificatePreviewComponent } from './certificate-preview.component';

describe('CertificatePreviewComponent', () => {
  let component: CertificatePreviewComponent;
  let fixture: ComponentFixture<CertificatePreviewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CertificatePreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CertificatePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
