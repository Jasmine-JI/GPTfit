import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeAccountComponent } from './change-account.component';

describe('ChangeAccountComponent', () => {
  let component: ChangeAccountComponent;
  let fixture: ComponentFixture<ChangeAccountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangeAccountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
