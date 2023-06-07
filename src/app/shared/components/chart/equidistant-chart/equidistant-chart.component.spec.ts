import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquidistantChartComponent } from './equidistant-chart.component';

describe('EquidistantChartComponent', () => {
  let component: EquidistantChartComponent;
  let fixture: ComponentFixture<EquidistantChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquidistantChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EquidistantChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
