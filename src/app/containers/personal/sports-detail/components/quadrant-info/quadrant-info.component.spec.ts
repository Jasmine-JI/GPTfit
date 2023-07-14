import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuadrantInfoComponent } from './quadrant-info.component';

describe('QuadrantInfoComponent', () => {
  let component: QuadrantInfoComponent;
  let fixture: ComponentFixture<QuadrantInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [QuadrantInfoComponent],
    });
    fixture = TestBed.createComponent(QuadrantInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
