import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TodayLoginnerWinComponent } from './today-loginner-win.component';

describe('TodayLoginnerWinComponent', () => {
  let component: TodayLoginnerWinComponent;
  let fixture: ComponentFixture<TodayLoginnerWinComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TodayLoginnerWinComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TodayLoginnerWinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
