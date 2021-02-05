import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RainbowColumnChartComponent } from './rainbow-column-chart.component';

describe('RainbowColumnChartComponent', () => {
  let component: RainbowColumnChartComponent;
  let fixture: ComponentFixture<RainbowColumnChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RainbowColumnChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RainbowColumnChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
