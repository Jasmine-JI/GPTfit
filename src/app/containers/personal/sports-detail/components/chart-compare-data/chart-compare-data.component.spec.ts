import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartCompareDataComponent } from './chart-compare-data.component';

describe('ChartCompareDataComponent', () => {
  let component: ChartCompareDataComponent;
  let fixture: ComponentFixture<ChartCompareDataComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ChartCompareDataComponent],
    });
    fixture = TestBed.createComponent(ChartCompareDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
