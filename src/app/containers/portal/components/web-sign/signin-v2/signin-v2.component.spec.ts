import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SigninV2Component } from './signin-v2.component';

describe('SigninV2Component', () => {
  let component: SigninV2Component;
  let fixture: ComponentFixture<SigninV2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SigninV2Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SigninV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
