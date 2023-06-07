import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AppModifypwComponent } from './app-modifypw.component';

describe('AppModifypwComponent', () => {
  let component: AppModifypwComponent;
  let fixture: ComponentFixture<AppModifypwComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AppModifypwComponent],
    }).compileComponents();
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
