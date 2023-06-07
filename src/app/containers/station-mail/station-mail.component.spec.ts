import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StationMailComponent } from './station-mail.component';

describe('StationMailComponent', () => {
  let component: StationMailComponent;
  let fixture: ComponentFixture<StationMailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StationMailComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StationMailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
