import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AllGroupListComponent } from './all-group-list.component';

describe('AllGroupListComponent', () => {
  let component: AllGroupListComponent;
  let fixture: ComponentFixture<AllGroupListComponent>;

  beforeEach(waitForAsync(() => {
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
