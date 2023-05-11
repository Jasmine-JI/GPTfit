import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangePhotoButtonComponent } from './change-photo-button.component';

describe('ChangePhotoButtonComponent', () => {
  let component: ChangePhotoButtonComponent;
  let fixture: ComponentFixture<ChangePhotoButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangePhotoButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePhotoButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
