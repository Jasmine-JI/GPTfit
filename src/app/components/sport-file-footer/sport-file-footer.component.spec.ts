import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SportFileFooterComponent } from './sport-file-footer.component';

describe('SportFileFooterComponent', () => {
  let component: SportFileFooterComponent;
  let fixture: ComponentFixture<SportFileFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SportFileFooterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SportFileFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
