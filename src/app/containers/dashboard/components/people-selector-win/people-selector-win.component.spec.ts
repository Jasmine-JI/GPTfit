import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InnerSelectorWinComponent } from './inner-selector-win.component';

describe('InnerSelectorWinComponent', () => {
  let component: InnerSelectorWinComponent;
  let fixture: ComponentFixture<InnerSelectorWinComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InnerSelectorWinComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InnerSelectorWinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
