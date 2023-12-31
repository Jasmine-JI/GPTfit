import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AppSignupComponent } from './app-signup.component';

describe('AppSignupComponent', () => {
  let component: AppSignupComponent;
  let fixture: ComponentFixture<AppSignupComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AppSignupComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppSignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
