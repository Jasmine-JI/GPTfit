import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FilletColumnChartComponent } from './fillet-column-chart.component';

describe('FilletColumnChartComponent', () => {
  let component: FilletColumnChartComponent;
  let fixture: ComponentFixture<FilletColumnChartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FilletColumnChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilletColumnChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
