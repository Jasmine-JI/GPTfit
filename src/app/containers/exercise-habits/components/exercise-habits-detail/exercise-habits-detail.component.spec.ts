import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExerciseHabitsDetailComponent } from './exercise-habits-detail.component';

describe('ExerciseHabitsDetailComponent', () => {
  let component: ExerciseHabitsDetailComponent;
  let fixture: ComponentFixture<ExerciseHabitsDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExerciseHabitsDetailComponent],
    });
    fixture = TestBed.createComponent(ExerciseHabitsDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
