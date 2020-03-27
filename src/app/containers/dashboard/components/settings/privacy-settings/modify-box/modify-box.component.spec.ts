import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifyBoxComponent } from './modify-box.component';

describe('ModifyBoxComponent', () => {
  let component: ModifyBoxComponent;
  let fixture: ComponentFixture<ModifyBoxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModifyBoxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModifyBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
