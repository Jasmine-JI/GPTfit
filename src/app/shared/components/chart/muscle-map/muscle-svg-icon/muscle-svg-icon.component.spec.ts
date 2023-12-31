import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MuscleSvgIconComponent } from './muscle-svg-icon.component';

describe('MuscleSvgIconComponent', () => {
  let component: MuscleSvgIconComponent;
  let fixture: ComponentFixture<MuscleSvgIconComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MuscleSvgIconComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MuscleSvgIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
