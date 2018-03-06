import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DbResultDialogComponent } from './db-result-dialog.component';

describe('DbResultDialogComponent', () => {
  let component: DbResultDialogComponent;
  let fixture: ComponentFixture<DbResultDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DbResultDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DbResultDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
