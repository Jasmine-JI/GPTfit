import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppModifypwComponent } from './app-modifypw.component';

describe('AppModifypwComponent', () => {
  let component: AppModifypwComponent;
  let fixture: ComponentFixture<AppModifypwComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppModifypwComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppModifypwComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
