import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AllTimesComponent } from './all-times.component';

describe('AllTimesComponent', () => {
  let component: AllTimesComponent;
  let fixture: ComponentFixture<AllTimesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AllTimesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AllTimesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
