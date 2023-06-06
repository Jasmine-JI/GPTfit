import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataCompareSectionComponent } from './data-compare-section.component';

describe('DataCompareSectionComponent', () => {
  let component: DataCompareSectionComponent;
  let fixture: ComponentFixture<DataCompareSectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DataCompareSectionComponent],
    });
    fixture = TestBed.createComponent(DataCompareSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
