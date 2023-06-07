import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MuscleMapCardComponent } from './muscle-map-card.component';

describe('MuscleMapCardComponent', () => {
  let component: MuscleMapCardComponent;
  let fixture: ComponentFixture<MuscleMapCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MuscleMapCardComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MuscleMapCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
