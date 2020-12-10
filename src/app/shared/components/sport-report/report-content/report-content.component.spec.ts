import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReportContentComponent } from './report-content.component';

describe('ReportContentComponent', () => {
  let component: ReportContentComponent;
  let fixture: ComponentFixture<ReportContentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReportContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
