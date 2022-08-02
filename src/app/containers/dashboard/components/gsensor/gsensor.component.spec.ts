import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GsensorComponent } from './gsensor.component';

describe('GsensorComponent', () => {
  let component: GsensorComponent;
  let fixture: ComponentFixture<GsensorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GsensorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GsensorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
