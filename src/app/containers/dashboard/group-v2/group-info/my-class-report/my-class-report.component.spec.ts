import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MyClassReportComponent } from './my-class-report.component';

describe('MyClassReportComponent', () => {
  let component: MyClassReportComponent;
  let fixture: ComponentFixture<MyClassReportComponent>;

  beforeEach(async(() => {
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
