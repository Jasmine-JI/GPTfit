import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPushMessageComponent } from './edit-push-message.component';

describe('EditPushMessageComponent', () => {
  let component: EditPushMessageComponent;
  let fixture: ComponentFixture<EditPushMessageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditPushMessageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditPushMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
