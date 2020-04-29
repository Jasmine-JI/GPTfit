import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QrcodeUploadComponent } from './qrcode-upload.component';

describe('QrcodeUploadComponent', () => {
  let component: QrcodeUploadComponent;
  let fixture: ComponentFixture<QrcodeUploadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QrcodeUploadComponent ]
    })
    .compileComponents();
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
