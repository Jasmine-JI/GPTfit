import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HrzoneInfoComponent } from './hrzone-info.component';

describe('HrzoneInfoComponent', () => {
  let component: HrzoneInfoComponent;
  let fixture: ComponentFixture<HrzoneInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HrzoneInfoComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HrzoneInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
