import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppFirstLoginComponent } from './app-first-login.component';

describe('AppFirstLoginComponent', () => {
  let component: AppFirstLoginComponent;
  let fixture: ComponentFixture<AppFirstLoginComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppFirstLoginComponent ]
    })
    .compileComponents();
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
