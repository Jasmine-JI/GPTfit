import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HrZoneDialogComponent } from './hr-zone-dialog.component';

describe('HrZoneDialogComponent', () => {
  let component: HrZoneDialogComponent;
  let fixture: ComponentFixture<HrZoneDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HrZoneDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HrZoneDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
