import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AppQrcodeLoginComponent } from './app-qrcode-login.component';

describe('AppQrcodeLoginComponent', () => {
  let component: AppQrcodeLoginComponent;
  let fixture: ComponentFixture<AppQrcodeLoginComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AppQrcodeLoginComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppQrcodeLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
