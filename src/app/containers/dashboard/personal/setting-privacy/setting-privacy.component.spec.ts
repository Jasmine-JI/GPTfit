import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingPrivacyComponent } from './setting-privacy.component';

describe('SettingPrivacyComponent', () => {
  let component: SettingPrivacyComponent;
  let fixture: ComponentFixture<SettingPrivacyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingPrivacyComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingPrivacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
