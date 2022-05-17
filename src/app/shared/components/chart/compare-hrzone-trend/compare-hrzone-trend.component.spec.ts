import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompareHrzoneTrendComponent } from './compare-hrzone-trend.component';

describe('CompareHrzoneTrendComponent', () => {
  let component: CompareHrzoneTrendComponent;
  let fixture: ComponentFixture<CompareHrzoneTrendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompareHrzoneTrendComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompareHrzoneTrendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
