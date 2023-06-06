import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SportsDetailComponent } from './sports-detail.component';

describe('SportsDetailComponent', () => {
  let component: SportsDetailComponent;
  let fixture: ComponentFixture<SportsDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SportsDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SportsDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
