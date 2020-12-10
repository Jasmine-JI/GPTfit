import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DbMaintainComponent } from './db-maintain.component';

describe('DbMaintainComponent', () => {
  let component: DbMaintainComponent;
  let fixture: ComponentFixture<DbMaintainComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DbMaintainComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DbMaintainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
