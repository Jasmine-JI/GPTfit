import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivacySettingButtonComponent } from './privacy-setting-button.component';

describe('PrivacySettingButtonComponent', () => {
  let component: PrivacySettingButtonComponent;
  let fixture: ComponentFixture<PrivacySettingButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacySettingButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacySettingButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
