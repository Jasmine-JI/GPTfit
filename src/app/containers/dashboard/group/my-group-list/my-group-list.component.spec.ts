import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MyGroupListComponent } from './my-group-list.component';

describe('MyGroupListComponent', () => {
  let component: MyGroupListComponent;
  let fixture: ComponentFixture<MyGroupListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MyGroupListComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyGroupListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
