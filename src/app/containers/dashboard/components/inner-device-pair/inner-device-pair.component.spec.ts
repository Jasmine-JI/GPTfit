import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InnerDevicePairComponent } from './inner-device-pair.component';

describe('InnerDevicePairComponent', () => {
  let component: InnerDevicePairComponent;
  let fixture: ComponentFixture<InnerDevicePairComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InnerDevicePairComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InnerDevicePairComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
