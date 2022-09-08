import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeightTrainLevelSelectorComponent } from './weight-train-level-selector.component';

describe('WeightTrainLevelSelectorComponent', () => {
  let component: WeightTrainLevelSelectorComponent;
  let fixture: ComponentFixture<WeightTrainLevelSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WeightTrainLevelSelectorComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WeightTrainLevelSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
