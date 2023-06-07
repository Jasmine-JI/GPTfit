import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMailComponent } from './create-mail.component';

describe('CreateMailComponent', () => {
  let component: CreateMailComponent;
  let fixture: ComponentFixture<CreateMailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateMailComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateMailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
