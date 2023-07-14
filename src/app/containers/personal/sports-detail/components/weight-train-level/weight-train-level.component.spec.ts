import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeightTrainLevelComponent } from './weight-train-level.component';

describe('WeightTrainLevelComponent', () => {
  let component: WeightTrainLevelComponent;
  let fixture: ComponentFixture<WeightTrainLevelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [WeightTrainLevelComponent],
    });
    fixture = TestBed.createComponent(WeightTrainLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
