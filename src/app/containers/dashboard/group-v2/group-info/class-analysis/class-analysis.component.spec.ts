import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ClassAnalysisComponent } from './class-analysis.component';

describe('ClassAnalysisComponent', () => {
  let component: ClassAnalysisComponent;
  let fixture: ComponentFixture<ClassAnalysisComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ClassAnalysisComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
