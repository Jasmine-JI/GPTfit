import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MuscleTrainListComponent } from './muscle-train-list.component';

describe('MuscleTrainListComponent', () => {
  let component: MuscleTrainListComponent;
  let fixture: ComponentFixture<MuscleTrainListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MuscleTrainListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MuscleTrainListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
