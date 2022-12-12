import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SportsFileRoadComponent } from './sports-file-road.component';

describe('SportsFileRoadComponent', () => {
  let component: SportsFileRoadComponent;
  let fixture: ComponentFixture<SportsFileRoadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SportsFileRoadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SportsFileRoadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
