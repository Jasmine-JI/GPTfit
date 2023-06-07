import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapChartCompareComponent } from './map-chart-compare.component';

describe('MapChartCompareComponent', () => {
  let component: MapChartCompareComponent;
  let fixture: ComponentFixture<MapChartCompareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapChartCompareComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MapChartCompareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
