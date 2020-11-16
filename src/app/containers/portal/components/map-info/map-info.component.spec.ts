import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MapInfoComponent } from './map-info.component';

describe('MapInfoComponent', () => {
  let component: MapInfoComponent;
  let fixture: ComponentFixture<MapInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MapInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
