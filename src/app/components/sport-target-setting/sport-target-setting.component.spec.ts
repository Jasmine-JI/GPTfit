import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SportTargetSettingComponent } from './sport-target-setting.component';

describe('SportTargetSettingComponent', () => {
  let component: SportTargetSettingComponent;
  let fixture: ComponentFixture<SportTargetSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SportTargetSettingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SportTargetSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
