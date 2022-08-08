import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TrainLiveComponent } from './train-live.component';

describe('TrainLiveComponent', () => {
  let component: TrainLiveComponent;
  let fixture: ComponentFixture<TrainLiveComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TrainLiveComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrainLiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
