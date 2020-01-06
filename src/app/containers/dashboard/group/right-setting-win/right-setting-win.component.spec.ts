import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RightSettingWinComponent } from './right-setting-win.component';

describe('RightSettingWinComponent', () => {
  let component: RightSettingWinComponent;
  let fixture: ComponentFixture<RightSettingWinComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RightSettingWinComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RightSettingWinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
