import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RealTimeLeaderboardComponent } from './real-time-leaderboard.component';

describe('RealTimeLeaderboardComponent', () => {
  let component: RealTimeLeaderboardComponent;
  let fixture: ComponentFixture<RealTimeLeaderboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RealTimeLeaderboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RealTimeLeaderboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
