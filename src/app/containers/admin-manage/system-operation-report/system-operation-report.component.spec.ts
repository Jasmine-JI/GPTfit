import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemOperationReportComponent } from './system-operation-report.component';

describe('SystemOperationReportComponent', () => {
  let component: SystemOperationReportComponent;
  let fixture: ComponentFixture<SystemOperationReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SystemOperationReportComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemOperationReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
