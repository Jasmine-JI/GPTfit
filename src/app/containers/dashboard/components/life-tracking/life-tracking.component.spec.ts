import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LifeTrackingComponent } from './life-tracking.component';

describe('LifeTrackingComponent', () => {
  let component: LifeTrackingComponent;
  let fixture: ComponentFixture<LifeTrackingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LifeTrackingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LifeTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
