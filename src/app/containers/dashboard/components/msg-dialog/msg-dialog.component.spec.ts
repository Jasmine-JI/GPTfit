import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckEnrollDialogComponent } from './check-enroll-dialog.component';

describe('CheckEnrollDialogComponent', () => {
  let component: CheckEnrollDialogComponent;
  let fixture: ComponentFixture<CheckEnrollDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CheckEnrollDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckEnrollDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
