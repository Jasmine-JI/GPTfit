import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuadrantChartComponent } from './quadrant-chart.component';

describe('QuadrantChartComponent', () => {
  let component: QuadrantChartComponent;
  let fixture: ComponentFixture<QuadrantChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [QuadrantChartComponent],
    });
    fixture = TestBed.createComponent(QuadrantChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
