import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ComLifeTrackingComponent } from './com-life-tracking.component';

describe('ComLifeTrackingComponent', () => {
  let component: ComLifeTrackingComponent;
  let fixture: ComponentFixture<ComLifeTrackingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ComLifeTrackingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ComLifeTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
