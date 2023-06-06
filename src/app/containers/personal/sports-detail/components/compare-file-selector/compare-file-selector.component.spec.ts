import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompareFileSelectorComponent } from './compare-file-selector.component';

describe('CompareFileSelectorComponent', () => {
  let component: CompareFileSelectorComponent;
  let fixture: ComponentFixture<CompareFileSelectorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CompareFileSelectorComponent],
    });
    fixture = TestBed.createComponent(CompareFileSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
