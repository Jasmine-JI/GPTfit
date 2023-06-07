import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupOperationListComponent } from './group-operation-list.component';

describe('GroupOperationListComponent', () => {
  let component: GroupOperationListComponent;
  let fixture: ComponentFixture<GroupOperationListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupOperationListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupOperationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
