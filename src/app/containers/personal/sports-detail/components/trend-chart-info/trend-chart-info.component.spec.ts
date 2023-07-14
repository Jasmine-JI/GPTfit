import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrendChartInfoComponent } from './trend-chart-info.component';

describe('TrendChartInfoComponent', () => {
  let component: TrendChartInfoComponent;
  let fixture: ComponentFixture<TrendChartInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TrendChartInfoComponent],
    });
    fixture = TestBed.createComponent(TrendChartInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
