import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DeviceLogDetailComponent } from './device-log-detail.component';

describe('DeviceLogDetailComponent', () => {
  let component: DeviceLogDetailComponent;
  let fixture: ComponentFixture<DeviceLogDetailComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DeviceLogDetailComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceLogDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
