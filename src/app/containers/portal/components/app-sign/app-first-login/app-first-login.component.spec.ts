import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AppFirstLoginComponent } from './app-first-login.component';

describe('AppFirstLoginComponent', () => {
  let component: AppFirstLoginComponent;
  let fixture: ComponentFixture<AppFirstLoginComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AppFirstLoginComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppFirstLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
