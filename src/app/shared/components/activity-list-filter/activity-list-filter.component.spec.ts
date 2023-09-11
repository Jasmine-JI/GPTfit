import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityListFilterComponent } from './activity-list-filter.component';

describe('ActivityListFilterComponent', () => {
  let component: ActivityListFilterComponent;
  let fixture: ComponentFixture<ActivityListFilterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ActivityListFilterComponent],
    });
    fixture = TestBed.createComponent(ActivityListFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
