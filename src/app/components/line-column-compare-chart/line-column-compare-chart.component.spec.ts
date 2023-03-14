import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineColumnCompareChartComponent } from './line-column-compare-chart.component';

describe('LineColumnCompareChartComponent', () => {
  let component: LineColumnCompareChartComponent;
  let fixture: ComponentFixture<LineColumnCompareChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineColumnCompareChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LineColumnCompareChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
