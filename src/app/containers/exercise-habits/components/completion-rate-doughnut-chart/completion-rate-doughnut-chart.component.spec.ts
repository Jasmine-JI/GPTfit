import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompletionRateDoughnutChartComponent } from './completion-rate-doughnut-chart.component';

describe('CompletionRateDoughnutChartComponent', () => {
  let component: CompletionRateDoughnutChartComponent;
  let fixture: ComponentFixture<CompletionRateDoughnutChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CompletionRateDoughnutChartComponent],
    });
    fixture = TestBed.createComponent(CompletionRateDoughnutChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
