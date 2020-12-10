import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FormRemindComponent } from './form-remind.component';

describe('FormRemindComponent', () => {
  let component: FormRemindComponent;
  let fixture: ComponentFixture<FormRemindComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FormRemindComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormRemindComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
