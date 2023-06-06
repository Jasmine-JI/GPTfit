import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LapInfoTableComponent } from './lap-info-table.component';

describe('LapInfoTableComponent', () => {
  let component: LapInfoTableComponent;
  let fixture: ComponentFixture<LapInfoTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LapInfoTableComponent],
    });
    fixture = TestBed.createComponent(LapInfoTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
