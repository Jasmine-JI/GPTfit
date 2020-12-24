import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { IntlPhoneInputComponent } from './intl-phone-input.component';

describe('IntlPhoneInputComponent', () => {
  let component: IntlPhoneInputComponent;
  let fixture: ComponentFixture<IntlPhoneInputComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ IntlPhoneInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IntlPhoneInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
