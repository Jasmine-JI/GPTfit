import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationListConditionComponent } from './operation-list-condition.component';

describe('OperationListConditionComponent', () => {
  let component: OperationListConditionComponent;
  let fixture: ComponentFixture<OperationListConditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperationListConditionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OperationListConditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
