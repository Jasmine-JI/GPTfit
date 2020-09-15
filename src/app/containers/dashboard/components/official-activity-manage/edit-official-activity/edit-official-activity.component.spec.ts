import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditOfficialActivityComponent } from './create-official-activity.component';

describe('EditOfficialActivityComponent', () => {
  let component: EditOfficialActivityComponent;
  let fixture: ComponentFixture<EditOfficialActivityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditOfficialActivityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditOfficialActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
