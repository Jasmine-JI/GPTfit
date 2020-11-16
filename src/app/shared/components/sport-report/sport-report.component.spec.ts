import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SportReportComponent } from './sport-report.component';

describe('SportReportComponent', () => {
  let component: SportReportComponent;
  let fixture: ComponentFixture<SportReportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SportReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SportReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
