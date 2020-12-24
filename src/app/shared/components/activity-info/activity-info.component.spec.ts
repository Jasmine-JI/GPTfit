import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ActivityInfoComponent } from './activity-info.component';

describe('ActivityInfoComponent', () => {
  let component: ActivityInfoComponent;
  let fixture: ComponentFixture<ActivityInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ActivityInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
