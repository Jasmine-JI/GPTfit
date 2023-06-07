import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditIndividualPrivacyComponent } from './edit-individual-privacy.component';

describe('EditIndividualPrivacyComponent', () => {
  let component: EditIndividualPrivacyComponent;
  let fixture: ComponentFixture<EditIndividualPrivacyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditIndividualPrivacyComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditIndividualPrivacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
