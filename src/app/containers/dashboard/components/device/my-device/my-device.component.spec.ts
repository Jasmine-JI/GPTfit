import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MyDeviceComponent } from './my-device.component';

describe('MyDeviceComponent', () => {
  let component: MyDeviceComponent;
  let fixture: ComponentFixture<MyDeviceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MyDeviceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyDeviceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
