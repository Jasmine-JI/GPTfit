import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppForgetpwComponent } from './app-forgetpw.component';

describe('AppForgetpwComponent', () => {
  let component: AppForgetpwComponent;
  let fixture: ComponentFixture<AppForgetpwComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppForgetpwComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppForgetpwComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
