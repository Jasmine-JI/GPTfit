import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HoverHintComponent } from './hover-hint.component';

describe('HoverHintComponent', () => {
  let component: HoverHintComponent;
  let fixture: ComponentFixture<HoverHintComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HoverHintComponent],
    }).compileComponents();
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
