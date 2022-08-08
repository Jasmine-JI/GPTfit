import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AppForgetpwComponent } from './app-forgetpw.component';

describe('AppForgetpwComponent', () => {
  let component: AppForgetpwComponent;
  let fixture: ComponentFixture<AppForgetpwComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AppForgetpwComponent],
    }).compileComponents();
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
