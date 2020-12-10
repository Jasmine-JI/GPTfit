import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AlaIframeComponent } from './ala-iframe.component';

describe('AlaIframeComponent', () => {
  let component: AlaIframeComponent;
  let fixture: ComponentFixture<AlaIframeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AlaIframeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AlaIframeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
