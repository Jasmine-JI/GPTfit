import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupIntroductionComponent } from './group-introduction.component';

describe('GroupIntroductionComponent', () => {
  let component: GroupIntroductionComponent;
  let fixture: ComponentFixture<GroupIntroductionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupIntroductionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupIntroductionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
