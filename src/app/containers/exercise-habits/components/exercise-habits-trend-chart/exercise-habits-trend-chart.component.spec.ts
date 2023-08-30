import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExerciseHabitsTrendChartComponent } from './exercise-habits-trend-chart.component';

describe('ExerciseHabitsTrendChartComponent', () => {
  let component: ExerciseHabitsTrendChartComponent;
  let fixture: ComponentFixture<ExerciseHabitsTrendChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExerciseHabitsTrendChartComponent],
    });
    fixture = TestBed.createComponent(ExerciseHabitsTrendChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
