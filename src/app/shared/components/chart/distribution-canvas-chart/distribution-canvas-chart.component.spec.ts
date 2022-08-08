import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DistributionCanvasChartComponent } from './distribution-canvas-chart.component';

describe('DistributionCanvasChartComponent', () => {
  let component: DistributionCanvasChartComponent;
  let fixture: ComponentFixture<DistributionCanvasChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DistributionCanvasChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DistributionCanvasChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
