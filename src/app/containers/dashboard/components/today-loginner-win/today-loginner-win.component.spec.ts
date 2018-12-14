import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TodayLoginnerWinComponent } from './today-loginner-win.component';

describe('TodayLoginnerWinComponent', () => {
  let component: TodayLoginnerWinComponent;
  let fixture: ComponentFixture<TodayLoginnerWinComponent>;

  beforeEach(async(() => {
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
