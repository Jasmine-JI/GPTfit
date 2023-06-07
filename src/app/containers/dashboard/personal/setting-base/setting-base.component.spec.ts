import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingBaseComponent } from './setting-base.component';

describe('SettingBaseComponent', () => {
  let component: SettingBaseComponent;
  let fixture: ComponentFixture<SettingBaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingBaseComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
