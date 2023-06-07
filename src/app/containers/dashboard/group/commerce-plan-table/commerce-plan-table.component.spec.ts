import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommercePlanTableComponent } from './commerce-plan-table.component';

describe('CommercePlanTableComponent', () => {
  let component: CommercePlanTableComponent;
  let fixture: ComponentFixture<CommercePlanTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CommercePlanTableComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommercePlanTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
