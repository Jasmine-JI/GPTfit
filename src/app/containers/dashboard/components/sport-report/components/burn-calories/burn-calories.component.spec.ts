import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BurnCaloriesComponent } from './burn-calories.component';

describe('BurnCaloriesComponent', () => {
  let component: BurnCaloriesComponent;
  let fixture: ComponentFixture<BurnCaloriesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BurnCaloriesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BurnCaloriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
