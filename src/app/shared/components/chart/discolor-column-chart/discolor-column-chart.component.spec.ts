import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DiscolorColumnChartComponent } from './discolor-column-chart.component';

describe('DiscolorColumnChartComponent', () => {
  let component: DiscolorColumnChartComponent;
  let fixture: ComponentFixture<DiscolorColumnChartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DiscolorColumnChartComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiscolorColumnChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
