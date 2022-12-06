import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisInfoMenuComponent } from './analysis-info-menu.component';

describe('AnalysisInfoMenuComponent', () => {
  let component: AnalysisInfoMenuComponent;
  let fixture: ComponentFixture<AnalysisInfoMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AnalysisInfoMenuComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalysisInfoMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
