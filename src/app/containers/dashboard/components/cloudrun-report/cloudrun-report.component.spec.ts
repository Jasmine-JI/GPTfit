import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudrunReportComponent } from './cloudrun-report.component';

describe('CloudrunReportComponent', () => {
  let component: CloudrunReportComponent;
  let fixture: ComponentFixture<CloudrunReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CloudrunReportComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudrunReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
