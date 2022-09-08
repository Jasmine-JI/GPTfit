import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompareExtremeGforceChartComponent } from './compare-extreme-gforce-chart.component';

describe('CompareExtremeGforceChartComponent', () => {
  let component: CompareExtremeGforceChartComponent;
  let fixture: ComponentFixture<CompareExtremeGforceChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CompareExtremeGforceChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompareExtremeGforceChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
