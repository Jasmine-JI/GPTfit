import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CoachRexComponent } from './coach-rex.component';

describe('CoachRexComponent', () => {
  let component: CoachRexComponent;
  let fixture: ComponentFixture<CoachRexComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CoachRexComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CoachRexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
