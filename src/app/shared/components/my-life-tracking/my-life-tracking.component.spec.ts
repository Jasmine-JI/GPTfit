import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MyLifeTrackingComponent } from './my-life-tracking.component';

describe('MyLifeTrackingComponent', () => {
  let component: MyLifeTrackingComponent;
  let fixture: ComponentFixture<MyLifeTrackingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MyLifeTrackingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyLifeTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
