import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryColumnChartComponent } from './category-column-chart.component';

describe('CategoryColumnChartComponent', () => {
  let component: CategoryColumnChartComponent;
  let fixture: ComponentFixture<CategoryColumnChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryColumnChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryColumnChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
