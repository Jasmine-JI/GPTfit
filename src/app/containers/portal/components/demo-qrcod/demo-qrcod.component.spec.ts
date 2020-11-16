import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DemoQrcodComponent } from './demo-qrcod.component';

describe('DemoQrcodComponent', () => {
  let component: DemoQrcodComponent;
  let fixture: ComponentFixture<DemoQrcodComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DemoQrcodComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DemoQrcodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
