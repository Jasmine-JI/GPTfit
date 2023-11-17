import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlapointAchievementComponent } from './alapoint-achievement.component';

describe('AlapointAchievementComponent', () => {
  let component: AlapointAchievementComponent;
  let fixture: ComponentFixture<AlapointAchievementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AlapointAchievementComponent],
    });
    fixture = TestBed.createComponent(AlapointAchievementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
