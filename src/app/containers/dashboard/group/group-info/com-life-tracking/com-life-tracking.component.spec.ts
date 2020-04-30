import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ComLifeTrackingComponent } from './com-life-tracking.component';

describe('ComLifeTrackingComponent', () => {
  let component: ComLifeTrackingComponent;
  let fixture: ComponentFixture<ComLifeTrackingComponent>;

  beforeEach(async(() => {
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
