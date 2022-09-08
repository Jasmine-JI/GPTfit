import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompareBodyWeightChartComponent } from './compare-body-weight-chart.component';

describe('CompareBodyWeightChartComponent', () => {
  let component: CompareBodyWeightChartComponent;
  let fixture: ComponentFixture<CompareBodyWeightChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CompareBodyWeightChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompareBodyWeightChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
