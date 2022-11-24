import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrZoneChartComponent } from './hr-zone-chart.component';

describe('HrZoneChartComponent', () => {
  let component: HrZoneChartComponent;
  let fixture: ComponentFixture<HrZoneChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HrZoneChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HrZoneChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
