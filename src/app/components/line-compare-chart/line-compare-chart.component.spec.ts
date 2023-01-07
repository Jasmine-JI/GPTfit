import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineCompareChartComponent } from './line-compare-chart.component';

describe('LineCompareChartComponent', () => {
  let component: LineCompareChartComponent;
  let fixture: ComponentFixture<LineCompareChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineCompareChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LineCompareChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
