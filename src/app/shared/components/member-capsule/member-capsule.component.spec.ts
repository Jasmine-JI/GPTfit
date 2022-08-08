import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MemberCapsuleComponent } from './member-capsule.component';

describe('MemberCapsuleComponent', () => {
  let component: MemberCapsuleComponent;
  let fixture: ComponentFixture<MemberCapsuleComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MemberCapsuleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MemberCapsuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
