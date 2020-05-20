import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ForgetpwV2Component } from './forgetpw-v2.component';

describe('ForgetpwV2Component', () => {
  let component: ForgetpwV2Component;
  let fixture: ComponentFixture<ForgetpwV2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ForgetpwV2Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ForgetpwV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
