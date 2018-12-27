import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TotalDistanceComponent } from './total-distance.component';

describe('TotalDistanceComponent', () => {
  let component: TotalDistanceComponent;
  let fixture: ComponentFixture<TotalDistanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TotalDistanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TotalDistanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
