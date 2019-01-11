import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AlaIframeComponent } from './ala-iframe.component';

describe('AlaIframeComponent', () => {
  let component: AlaIframeComponent;
  let fixture: ComponentFixture<AlaIframeComponent>;

  beforeEach(async(() => {
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
