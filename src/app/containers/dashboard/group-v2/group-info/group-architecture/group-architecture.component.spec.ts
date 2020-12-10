import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GroupArchitectureComponent } from './group-architecture.component';

describe('GroupArchitectureComponent', () => {
  let component: GroupArchitectureComponent;
  let fixture: ComponentFixture<GroupArchitectureComponent>;

  beforeEach(waitForAsync(() => {
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
