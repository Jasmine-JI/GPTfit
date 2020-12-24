import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { OfficialActivityComponent } from './official-activity.component';

describe('OfficialActivityComponent', () => {
  let component: OfficialActivityComponent;
  let fixture: ComponentFixture<OfficialActivityComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OfficialActivityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OfficialActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
