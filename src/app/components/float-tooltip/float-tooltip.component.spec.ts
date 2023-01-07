import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatTooltipComponent } from './float-tooltip.component';

describe('FloatTooltipComponent', () => {
  let component: FloatTooltipComponent;
  let fixture: ComponentFixture<FloatTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatTooltipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FloatTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
