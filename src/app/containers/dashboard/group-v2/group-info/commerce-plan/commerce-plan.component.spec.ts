import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommercePlanComponent } from './commerce-plan.component';

describe('CommercePlanComponent', () => {
  let component: CommercePlanComponent;
  let fixture: ComponentFixture<CommercePlanComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CommercePlanComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommercePlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
