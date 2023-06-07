import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppDestroyAccountComponent } from './app-destroy-account.component';

describe('AppDestroyAccountComponent', () => {
  let component: AppDestroyAccountComponent;
  let fixture: ComponentFixture<AppDestroyAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppDestroyAccountComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppDestroyAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
