import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HrzoneChartComponent } from './hrzone-chart.component';

describe('HrzoneChartComponent', () => {
  let component: HrzoneChartComponent;
  let fixture: ComponentFixture<HrzoneChartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HrzoneChartComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HrzoneChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
