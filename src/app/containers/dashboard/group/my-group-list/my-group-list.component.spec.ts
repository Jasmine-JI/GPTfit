import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MyGroupListComponent } from './my-group-list.component';

describe('MyGroupListComponent', () => {
  let component: MyGroupListComponent;
  let fixture: ComponentFixture<MyGroupListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MyGroupListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyGroupListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
