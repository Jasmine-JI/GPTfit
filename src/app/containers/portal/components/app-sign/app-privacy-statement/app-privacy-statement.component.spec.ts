import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppPrivacyStatementComponent } from './app-privacy-statement.component';

describe('AppPrivacyStatementComponent', () => {
  let component: AppPrivacyStatementComponent;
  let fixture: ComponentFixture<AppPrivacyStatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppPrivacyStatementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppPrivacyStatementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
