import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LeaderboardSettingsComponent } from './leaderboard-settings.component';

describe('LeaderboardSettingsComponent', () => {
  let component: LeaderboardSettingsComponent;
  let fixture: ComponentFixture<LeaderboardSettingsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LeaderboardSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LeaderboardSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
