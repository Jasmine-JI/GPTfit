import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { QrcodeUploadComponent } from './qrcode-upload.component';

describe('QrcodeUploadComponent', () => {
  let component: QrcodeUploadComponent;
  let fixture: ComponentFixture<QrcodeUploadComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [QrcodeUploadComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QrcodeUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
