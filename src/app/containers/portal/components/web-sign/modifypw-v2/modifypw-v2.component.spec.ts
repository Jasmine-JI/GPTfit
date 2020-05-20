import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifypwV2Component } from './modifypw-v2.component';

describe('ModifypwV2Component', () => {
  let component: ModifypwV2Component;
  let fixture: ComponentFixture<ModifypwV2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModifypwV2Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModifypwV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
