import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CheckEnrollDialogComponent } from './check-enroll-dialog.component';

describe('CheckEnrollDialogComponent', () => {
  let component: CheckEnrollDialogComponent;
  let fixture: ComponentFixture<CheckEnrollDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CheckEnrollDialogComponent],
    }).compileComponents();
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
