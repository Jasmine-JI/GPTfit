import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HoverHintComponent } from './hover-hint.component';

describe('HoverHintComponent', () => {
  let component: HoverHintComponent;
  let fixture: ComponentFixture<HoverHintComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HoverHintComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HoverHintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
