import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompareColumnTrendComponent } from './compare-column-trend.component';

describe('CompareColumnTrendComponent', () => {
  let component: CompareColumnTrendComponent;
  let fixture: ComponentFixture<CompareColumnTrendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CompareColumnTrendComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompareColumnTrendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
