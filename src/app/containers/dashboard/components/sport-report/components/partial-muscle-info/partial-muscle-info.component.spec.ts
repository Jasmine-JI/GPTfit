import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PartialMuscleInfoComponent } from './partial-muscle-info.component';

describe('PartialMuscleInfoComponent', () => {
  let component: PartialMuscleInfoComponent;
  let fixture: ComponentFixture<PartialMuscleInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PartialMuscleInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PartialMuscleInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
