import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SportReportComponent } from './sport-report.component';

describe('SportReportComponent', () => {
  let component: SportReportComponent;
  let fixture: ComponentFixture<SportReportComponent>;

  beforeEach(async(() => {
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
