import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppEnableComponent } from './app-enable.component';

describe('AppEnableComponent', () => {
  let component: AppEnableComponent;
  let fixture: ComponentFixture<AppEnableComponent>;

  beforeEach(async(() => {
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
