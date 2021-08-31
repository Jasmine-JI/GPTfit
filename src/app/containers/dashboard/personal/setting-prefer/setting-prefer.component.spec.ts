import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingPreferComponent } from './setting-prefer.component';

describe('SettingPreferComponent', () => {
  let component: SettingPreferComponent;
  let fixture: ComponentFixture<SettingPreferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingPreferComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingPreferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
