import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SportsReportComponent } from './sports-report.component';

describe('SportsReportComponent', () => {
  let component: SportsReportComponent;
  let fixture: ComponentFixture<SportsReportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SportsReportComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SportsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
