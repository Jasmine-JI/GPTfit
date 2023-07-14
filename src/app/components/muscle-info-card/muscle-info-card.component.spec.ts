import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MuscleInfoCardComponent } from './muscle-info-card.component';

describe('MuscleInfoCardComponent', () => {
  let component: MuscleInfoCardComponent;
  let fixture: ComponentFixture<MuscleInfoCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MuscleInfoCardComponent],
    });
    fixture = TestBed.createComponent(MuscleInfoCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
