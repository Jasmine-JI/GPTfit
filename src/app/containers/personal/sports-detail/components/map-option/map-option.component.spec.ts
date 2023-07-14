import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapOptionComponent } from './map-option.component';

describe('MapOptionComponent', () => {
  let component: MapOptionComponent;
  let fixture: ComponentFixture<MapOptionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MapOptionComponent],
    });
    fixture = TestBed.createComponent(MapOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
