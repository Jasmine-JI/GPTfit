import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MaxHRComponent } from './max-hr.component';

describe('MaxHRComponent', () => {
  let component: MaxHRComponent;
  let fixture: ComponentFixture<MaxHRComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MaxHRComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MaxHRComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
