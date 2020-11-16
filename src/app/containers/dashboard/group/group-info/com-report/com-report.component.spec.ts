import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ComReportComponent } from './com-report.component';

describe('ComReportComponent', () => {
  let component: ComReportComponent;
  let fixture: ComponentFixture<ComReportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ComReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ComReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
