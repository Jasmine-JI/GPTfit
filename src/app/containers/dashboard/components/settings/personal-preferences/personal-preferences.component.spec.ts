import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PersonalPreferencesComponent } from './personal-preferences.component';

describe('PersonalPreferencesComponent', () => {
  let component: PersonalPreferencesComponent;
  let fixture: ComponentFixture<PersonalPreferencesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PersonalPreferencesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonalPreferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
