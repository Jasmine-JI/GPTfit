import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantsManageComponent } from './participants-manage.component';

describe('ParticipantsManageComponent', () => {
  let component: ParticipantsManageComponent;
  let fixture: ComponentFixture<ParticipantsManageComponent>;

  beforeEach(async(() => {
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
