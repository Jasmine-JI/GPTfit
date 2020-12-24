import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AppChangeAccountComponent } from './app-change-account.component';

describe('AppChangeAccountComponent', () => {
  let component: AppChangeAccountComponent;
  let fixture: ComponentFixture<AppChangeAccountComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AppChangeAccountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppChangeAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
