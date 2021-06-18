import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelativeColumnChartComponent } from './relative-column-chart.component';

describe('RelativeColumnChartComponent', () => {
  let component: RelativeColumnChartComponent;
  let fixture: ComponentFixture<RelativeColumnChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RelativeColumnChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RelativeColumnChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
