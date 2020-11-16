import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MyClassReportComponent } from './my-class-report.component';

describe('MyClassReportComponent', () => {
  let component: MyClassReportComponent;
  let fixture: ComponentFixture<MyClassReportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MyClassReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyClassReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
