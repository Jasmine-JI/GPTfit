import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MyReportComponent } from './my-report.component';

describe('MyReportComponent', () => {
  let component: MyReportComponent;
  let fixture: ComponentFixture<MyReportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MyReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
