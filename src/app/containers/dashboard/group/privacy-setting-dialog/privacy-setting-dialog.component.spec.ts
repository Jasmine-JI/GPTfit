import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivacySettingDialogComponent } from './privacy-setting-dialog.component';

describe('PrivacySettingDialogComponent', () => {
  let component: PrivacySettingDialogComponent;
  let fixture: ComponentFixture<PrivacySettingDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrivacySettingDialogComponent ]
    })
    .compileComponents();
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