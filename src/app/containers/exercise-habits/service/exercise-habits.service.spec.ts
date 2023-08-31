import { TestBed } from '@angular/core/testing';

import { ExerciseHabitsService } from './exercise-habits.service';

describe('ExerciseHabitsService', () => {
  let service: ExerciseHabitsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExerciseHabitsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
