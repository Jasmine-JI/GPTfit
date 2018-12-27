import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommercePlanTableComponent } from './commerce-plan-table.component';

describe('CommercePlanTableComponent', () => {
  let component: CommercePlanTableComponent;
  let fixture: ComponentFixture<CommercePlanTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CommercePlanTableComponent ]
    })
    .compileComponents();
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
