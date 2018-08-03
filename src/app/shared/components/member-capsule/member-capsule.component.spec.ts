import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberCapsuleComponent } from './member-capsule.component';

describe('MemberCapsuleComponent', () => {
  let component: MemberCapsuleComponent;
  let fixture: ComponentFixture<MemberCapsuleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MemberCapsuleComponent ]
    })
    .compileComponents();
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
