import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlaAppAnalysisComponent } from './ala-app-analysis.component';

describe('AlaAppAnalysisComponent', () => {
  let component: AlaAppAnalysisComponent;
  let fixture: ComponentFixture<AlaAppAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AlaAppAnalysisComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AlaAppAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
