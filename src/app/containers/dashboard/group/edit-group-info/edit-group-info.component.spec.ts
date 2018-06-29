import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditGroupInfoComponent } from './edit-group-info.component';

describe('EditGroupInfoComponent', () => {
  let component: EditGroupInfoComponent;
  let fixture: ComponentFixture<EditGroupInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditGroupInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditGroupInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
