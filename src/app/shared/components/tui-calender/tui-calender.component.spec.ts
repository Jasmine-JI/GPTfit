import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TuiCalenderComponent } from './tui-calender.component';

describe('TuiCalenderComponent', () => {
  let component: TuiCalenderComponent;
  let fixture: ComponentFixture<TuiCalenderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TuiCalenderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TuiCalenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
