import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SportsDataTableComponent } from './sports-data-table.component';

describe('SportsDataTableComponent', () => {
  let component: SportsDataTableComponent;
  let fixture: ComponentFixture<SportsDataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SportsDataTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SportsDataTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
