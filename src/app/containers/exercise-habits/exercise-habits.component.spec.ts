import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcerciseHabitsComponent } from './exercise-habits.component';

describe('ExcerciseHabitsComponent', () => {
  let component: ExcerciseHabitsComponent;
  let fixture: ComponentFixture<ExcerciseHabitsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExcerciseHabitsComponent],
    });
    fixture = TestBed.createComponent(ExcerciseHabitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
