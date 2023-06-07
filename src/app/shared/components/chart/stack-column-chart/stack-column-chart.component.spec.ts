import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StackColumnChartComponent } from './stack-column-chart.component';

describe('StackColumnChartComponent', () => {
  let component: StackColumnChartComponent;
  let fixture: ComponentFixture<StackColumnChartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [StackColumnChartComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StackColumnChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
