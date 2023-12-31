import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CompareLineChartComponent } from './compare-line-chart.component';

describe('CompareLineChartComponent', () => {
  let component: CompareLineChartComponent;
  let fixture: ComponentFixture<CompareLineChartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CompareLineChartComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompareLineChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
