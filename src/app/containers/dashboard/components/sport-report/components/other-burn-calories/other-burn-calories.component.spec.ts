import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OtherBurnCaloriesComponent } from './other-burn-calories.component';

describe('OtherBurnCaloriesComponent', () => {
  let component: OtherBurnCaloriesComponent;
  let fixture: ComponentFixture<OtherBurnCaloriesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OtherBurnCaloriesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OtherBurnCaloriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
