import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AllDurationComponent } from './all-duration.component';

describe('AllDurationComponent', () => {
  let component: AllDurationComponent;
  let fixture: ComponentFixture<AllDurationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AllDurationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AllDurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
