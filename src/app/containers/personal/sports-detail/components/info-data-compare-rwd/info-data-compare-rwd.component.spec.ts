import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoDataCompareRwdComponent } from './info-data-compare-rwd.component';

describe('InfoDataCompareRwdComponent', () => {
  let component: InfoDataCompareRwdComponent;
  let fixture: ComponentFixture<InfoDataCompareRwdComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InfoDataCompareRwdComponent],
    });
    fixture = TestBed.createComponent(InfoDataCompareRwdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
