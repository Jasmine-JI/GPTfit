import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrendInfoChartComponent } from './trend-info-chart.component';

describe('TrendInfoChartComponent', () => {
  let component: TrendInfoChartComponent;
  let fixture: ComponentFixture<TrendInfoChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrendInfoChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TrendInfoChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
