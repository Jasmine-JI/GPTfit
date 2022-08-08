import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TargetAchieveChartComponent } from './target-achieve-chart.component';

describe('TargetAchieveChartComponent', () => {
  let component: TargetAchieveChartComponent;
  let fixture: ComponentFixture<TargetAchieveChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TargetAchieveChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TargetAchieveChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
