import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AverageHRComponent } from './average-hr.component';

describe('AverageHRComponent', () => {
  let component: AverageHRComponent;
  let fixture: ComponentFixture<AverageHRComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AverageHRComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AverageHRComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
