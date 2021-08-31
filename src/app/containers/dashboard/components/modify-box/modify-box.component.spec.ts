import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModifyBoxComponent } from './modify-box.component';

describe('ModifyBoxComponent', () => {
  let component: ModifyBoxComponent;
  let fixture: ComponentFixture<ModifyBoxComponent>;

  beforeEach(waitForAsync(() => {
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
