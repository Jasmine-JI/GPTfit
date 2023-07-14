import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineAreaCompareChartComponent } from './line-area-compare-chart.component';

describe('LineAreaCompareChartComponent', () => {
  let component: LineAreaCompareChartComponent;
  let fixture: ComponentFixture<LineAreaCompareChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LineAreaCompareChartComponent],
    });
    fixture = TestBed.createComponent(LineAreaCompareChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
