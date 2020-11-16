import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ParticipantsManageComponent } from './participants-manage.component';

describe('ParticipantsManageComponent', () => {
  let component: ParticipantsManageComponent;
  let fixture: ComponentFixture<ParticipantsManageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ParticipantsManageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantsManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
