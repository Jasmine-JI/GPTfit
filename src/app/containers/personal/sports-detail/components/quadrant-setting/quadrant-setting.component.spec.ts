import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuadrantSettingComponent } from './quadrant-setting.component';

describe('QuadrantSettingComponent', () => {
  let component: QuadrantSettingComponent;
  let fixture: ComponentFixture<QuadrantSettingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [QuadrantSettingComponent],
    });
    fixture = TestBed.createComponent(QuadrantSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
