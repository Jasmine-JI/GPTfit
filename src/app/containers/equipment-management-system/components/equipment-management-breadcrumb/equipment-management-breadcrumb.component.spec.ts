import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipmentManagementBreadcrumbComponent } from './equipment-management-breadcrumb.component';

describe('EquipmentManagementBreadcrumbComponent', () => {
  let component: EquipmentManagementBreadcrumbComponent;
  let fixture: ComponentFixture<EquipmentManagementBreadcrumbComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EquipmentManagementBreadcrumbComponent],
    });
    fixture = TestBed.createComponent(EquipmentManagementBreadcrumbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
