import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllInfoDataComponent } from './all-info-data.component';

describe('AllInfoDataComponent', () => {
  let component: AllInfoDataComponent;
  let fixture: ComponentFixture<AllInfoDataComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AllInfoDataComponent],
    });
    fixture = TestBed.createComponent(AllInfoDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
