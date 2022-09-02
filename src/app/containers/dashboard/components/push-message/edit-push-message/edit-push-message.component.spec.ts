import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditPushMessageComponent } from './edit-push-message.component';

describe('EditPushMessageComponent', () => {
  let component: EditPushMessageComponent;
  let fixture: ComponentFixture<EditPushMessageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [EditPushMessageComponent],
    }).compileComponents();
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
