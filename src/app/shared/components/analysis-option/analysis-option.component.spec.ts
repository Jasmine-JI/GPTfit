import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisOptionComponent } from './analysis-option.component';

describe('AnalysisOptionComponent', () => {
  let component: AnalysisOptionComponent;
  let fixture: ComponentFixture<AnalysisOptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnalysisOptionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalysisOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
