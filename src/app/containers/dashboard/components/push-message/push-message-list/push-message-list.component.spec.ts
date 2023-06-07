import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PushMessageListComponent } from './push-message-list.component';

describe('PushMessageListComponent', () => {
  let component: PushMessageListComponent;
  let fixture: ComponentFixture<PushMessageListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PushMessageListComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PushMessageListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
