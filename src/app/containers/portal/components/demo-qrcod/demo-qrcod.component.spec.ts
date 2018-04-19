import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoQrcodComponent } from './demo-qrcod.component';

describe('DemoQrcodComponent', () => {
  let component: DemoQrcodComponent;
  let fixture: ComponentFixture<DemoQrcodComponent>;

  beforeEach(async(() => {
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
