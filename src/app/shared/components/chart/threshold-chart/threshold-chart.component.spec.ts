import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThresholdChartComponent } from './threshold-chart.component';

describe('ThresholdChartComponent', () => {
  let component: ThresholdChartComponent;
  let fixture: ComponentFixture<ThresholdChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ThresholdChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThresholdChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
