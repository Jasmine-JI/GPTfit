import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AverageSpeedComponent } from './average-speed.component';

describe('AverageSpeedComponent', () => {
  let component: AverageSpeedComponent;
  let fixture: ComponentFixture<AverageSpeedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AverageSpeedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AverageSpeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
