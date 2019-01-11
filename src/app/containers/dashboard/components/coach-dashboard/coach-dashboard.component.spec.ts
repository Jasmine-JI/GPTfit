import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoachRexComponent } from './coach-rex.component';

describe('CoachRexComponent', () => {
  let component: CoachRexComponent;
  let fixture: ComponentFixture<CoachRexComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CoachRexComponent ]
    })
    .compileComponents();
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
