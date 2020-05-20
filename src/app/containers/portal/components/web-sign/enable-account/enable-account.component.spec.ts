import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnableAccountComponent } from './enable-account.component';

describe('EnableAccountComponent', () => {
  let component: EnableAccountComponent;
  let fixture: ComponentFixture<EnableAccountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EnableAccountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnableAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
