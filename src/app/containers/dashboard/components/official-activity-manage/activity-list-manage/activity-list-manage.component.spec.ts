import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityListManageComponent } from './activity-list-manage.component';

describe('ActivityListManageComponent', () => {
  let component: ActivityListManageComponent;
  let fixture: ComponentFixture<ActivityListManageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ActivityListManageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityListManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
