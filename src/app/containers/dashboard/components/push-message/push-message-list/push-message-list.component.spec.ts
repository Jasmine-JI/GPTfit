import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PushMessageListComponent } from './push-message-list.component';

describe('PushMessageListComponent', () => {
  let component: PushMessageListComponent;
  let fixture: ComponentFixture<PushMessageListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PushMessageListComponent ]
    })
    .compileComponents();
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
