import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SportsTargetTipComponent } from './sports-target-tip.component';

describe('SportsTargetTipComponent', () => {
  let component: SportsTargetTipComponent;
  let fixture: ComponentFixture<SportsTargetTipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SportsTargetTipComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SportsTargetTipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
