import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoachDashboardDetailComponent } from './coach-dashboard-detail.component';

describe('CoachDashboardDetailComponent', () => {
  let component: CoachDashboardDetailComponent;
  let fixture: ComponentFixture<CoachDashboardDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CoachDashboardDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CoachDashboardDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
