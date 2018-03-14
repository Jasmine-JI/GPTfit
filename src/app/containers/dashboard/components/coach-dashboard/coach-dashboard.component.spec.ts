import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoachDashboardComponent } from './coach-dashboard.component';

describe('CoachDashboardComponent', () => {
  let component: CoachDashboardComponent;
  let fixture: ComponentFixture<CoachDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CoachDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CoachDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
