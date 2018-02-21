import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceLogComponent } from './device-log.component';

describe('DeviceLogComponent', () => {
  let component: DeviceLogComponent;
  let fixture: ComponentFixture<DeviceLogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeviceLogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
