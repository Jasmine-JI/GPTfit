import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MyLifeTrackingComponent } from './my-life-tracking.component';

describe('MyLifeTrackingComponent', () => {
  let component: MyLifeTrackingComponent;
  let fixture: ComponentFixture<MyLifeTrackingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MyLifeTrackingComponent],
    }).compileComponents();
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
