import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GroupIntroductionComponent } from './group-introduction.component';

describe('GroupIntroductionComponent', () => {
  let component: GroupIntroductionComponent;
  let fixture: ComponentFixture<GroupIntroductionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [GroupIntroductionComponent],
    }).compileComponents();
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
