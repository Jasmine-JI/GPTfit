import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ComReportComponent } from './com-report.component';

describe('ComReportComponent', () => {
  let component: ComReportComponent;
  let fixture: ComponentFixture<ComReportComponent>;

  beforeEach(async(() => {
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
