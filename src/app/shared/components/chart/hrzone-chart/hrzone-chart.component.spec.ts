import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HrzoneChartComponent } from './hrzone-chart.component';

describe('HrzoneChartComponent', () => {
  let component: HrzoneChartComponent;
  let fixture: ComponentFixture<HrzoneChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HrzoneChartComponent ]
    })
    .compileComponents();
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
