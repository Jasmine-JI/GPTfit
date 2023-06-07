import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InnerTestComponent } from './inner-test.component';

describe('InnerTestComponent', () => {
  let component: InnerTestComponent;
  let fixture: ComponentFixture<InnerTestComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [InnerTestComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InnerTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
