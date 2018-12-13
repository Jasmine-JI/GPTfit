import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalPreferencesComponent } from './personal-preferences.component';

describe('PersonalPreferencesComponent', () => {
  let component: PersonalPreferencesComponent;
  let fixture: ComponentFixture<PersonalPreferencesComponent>;

  beforeEach(async(() => {
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
