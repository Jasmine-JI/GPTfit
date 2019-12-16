import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MuscleMapComponent } from './muscle-map.component';

describe('MuscleMapComponent', () => {
  let component: MuscleMapComponent;
  let fixture: ComponentFixture<MuscleMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MuscleMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MuscleMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
