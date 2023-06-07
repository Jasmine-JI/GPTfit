import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DistributionChartComponent } from './distribution-chart.component';

describe('DistributionChartComponent', () => {
  let component: DistributionChartComponent;
  let fixture: ComponentFixture<DistributionChartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DistributionChartComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DistributionChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
