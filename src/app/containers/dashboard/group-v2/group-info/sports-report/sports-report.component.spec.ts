import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SportsReportComponent } from './sports-report.component';

describe('SportsReportComponent', () => {
  let component: SportsReportComponent;
  let fixture: ComponentFixture<SportsReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SportsReportComponent ]
    })
    .compileComponents();
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
