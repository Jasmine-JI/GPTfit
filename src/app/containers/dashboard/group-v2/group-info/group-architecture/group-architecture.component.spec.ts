import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupArchitectureComponent } from './group-architecture.component';

describe('GroupArchitectureComponent', () => {
  let component: GroupArchitectureComponent;
  let fixture: ComponentFixture<GroupArchitectureComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupArchitectureComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupArchitectureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
