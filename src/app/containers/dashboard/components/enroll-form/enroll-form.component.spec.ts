import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EnrollFormComponent } from './enroll-form.component';

describe('EnrollFormComponent', () => {
  let component: EnrollFormComponent;
  let fixture: ComponentFixture<EnrollFormComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EnrollFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnrollFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
