import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComparePaceChartComponent } from './compare-pace-chart.component';

describe('ComparePaceChartComponent', () => {
  let component: ComparePaceChartComponent;
  let fixture: ComponentFixture<ComparePaceChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComparePaceChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComparePaceChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
