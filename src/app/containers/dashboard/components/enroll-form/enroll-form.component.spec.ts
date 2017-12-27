import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnrollFormComponent } from './enroll-form.component';

describe('EnrollFormComponent', () => {
  let component: EnrollFormComponent;
  let fixture: ComponentFixture<EnrollFormComponent>;

  beforeEach(async(() => {
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
