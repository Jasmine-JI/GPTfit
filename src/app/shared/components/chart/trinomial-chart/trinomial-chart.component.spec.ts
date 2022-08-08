import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrinomialChartComponent } from './trinomial-chart.component';

describe('TrinomialChartComponent', () => {
  let component: TrinomialChartComponent;
  let fixture: ComponentFixture<TrinomialChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TrinomialChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TrinomialChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
