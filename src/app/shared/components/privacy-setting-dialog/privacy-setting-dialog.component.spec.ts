import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PrivacySettingDialogComponent } from './privacy-setting-dialog.component';

describe('PrivacySettingDialogComponent', () => {
  let component: PrivacySettingDialogComponent;
  let fixture: ComponentFixture<PrivacySettingDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PrivacySettingDialogComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrivacySettingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
