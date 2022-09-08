import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmallHrzoneChartComponent } from './small-hrzone-chart.component';

describe('SmallHrzoneChartComponent', () => {
  let component: SmallHrzoneChartComponent;
  let fixture: ComponentFixture<SmallHrzoneChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SmallHrzoneChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SmallHrzoneChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
