import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EventManagementComponent } from './event-management.component';

describe('EventManagementComponent', () => {
  let component: EventManagementComponent;
  let fixture: ComponentFixture<EventManagementComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EventManagementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
