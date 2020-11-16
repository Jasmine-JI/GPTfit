import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AppEnableComponent } from './app-enable.component';

describe('AppEnableComponent', () => {
  let component: AppEnableComponent;
  let fixture: ComponentFixture<AppEnableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AppEnableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppEnableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
