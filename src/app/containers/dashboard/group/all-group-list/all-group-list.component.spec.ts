import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AllGroupListComponent } from './all-group-list.component';

describe('AllGroupListComponent', () => {
  let component: AllGroupListComponent;
  let fixture: ComponentFixture<AllGroupListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AllGroupListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AllGroupListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
