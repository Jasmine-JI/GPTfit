import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SignupV2Component } from './signup-v2.component';

describe('SignupV2Component', () => {
  let component: SignupV2Component;
  let fixture: ComponentFixture<SignupV2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SignupV2Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignupV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
