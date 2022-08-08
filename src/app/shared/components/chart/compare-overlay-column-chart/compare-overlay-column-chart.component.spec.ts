import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompareOverlayColumnChartComponent } from './compare-overlay-column-chart.component';

describe('CompareOverlayColumnChartComponent', () => {
  let component: CompareOverlayColumnChartComponent;
  let fixture: ComponentFixture<CompareOverlayColumnChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CompareOverlayColumnChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompareOverlayColumnChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
