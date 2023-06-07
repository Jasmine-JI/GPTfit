import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SportsReportComponent } from './sports-report.component';

describe('SportsReportComponent', () => {
  let component: SportsReportComponent;
  let fixture: ComponentFixture<SportsReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SportsReportComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SportsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
