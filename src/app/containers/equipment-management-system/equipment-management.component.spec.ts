import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipmentManagementComponent } from './equipment-management.component';

describe('EquipmentManagementSystemComponent', () => {
  let component: EquipmentManagementComponent;
  let fixture: ComponentFixture<EquipmentManagementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EquipmentManagementComponent],
    });
    fixture = TestBed.createComponent(EquipmentManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
