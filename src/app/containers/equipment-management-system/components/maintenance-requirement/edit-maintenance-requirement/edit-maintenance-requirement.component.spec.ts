import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditMaintenanceRequirementComponent } from './edit-maintenance-requirement.component';

describe('EditMaintenanceRequirementComponent', () => {
  let component: EditMaintenanceRequirementComponent;
  let fixture: ComponentFixture<EditMaintenanceRequirementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EditMaintenanceRequirementComponent],
    });
    fixture = TestBed.createComponent(EditMaintenanceRequirementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
