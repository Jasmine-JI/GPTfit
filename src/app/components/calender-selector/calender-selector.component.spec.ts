import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalenderSelectorComponent } from './calender-selector.component';

describe('CalenderSelectorComponent', () => {
  let component: CalenderSelectorComponent;
  let fixture: ComponentFixture<CalenderSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalenderSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CalenderSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
