import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AppSigninComponent } from './app-signin.component';

describe('AppSigninComponent', () => {
  let component: AppSigninComponent;
  let fixture: ComponentFixture<AppSigninComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AppSigninComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppSigninComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
