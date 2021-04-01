import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudrunMapComponent } from './cloudrun-map.component';

describe('CloudrunMapComponent', () => {
  let component: CloudrunMapComponent;
  let fixture: ComponentFixture<CloudrunMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CloudrunMapComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudrunMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
