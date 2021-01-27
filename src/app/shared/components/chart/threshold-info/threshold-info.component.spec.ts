import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThresholdInfoComponent } from './threshold-info.component';

describe('ThresholdInfoComponent', () => {
  let component: ThresholdInfoComponent;
  let fixture: ComponentFixture<ThresholdInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThresholdInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThresholdInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
