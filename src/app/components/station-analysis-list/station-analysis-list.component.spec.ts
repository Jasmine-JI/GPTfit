import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StationAnalysisListComponent } from './station-analysis-list.component';

describe('StationAnalysisListComponent', () => {
  let component: StationAnalysisListComponent;
  let fixture: ComponentFixture<StationAnalysisListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StationAnalysisListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StationAnalysisListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
