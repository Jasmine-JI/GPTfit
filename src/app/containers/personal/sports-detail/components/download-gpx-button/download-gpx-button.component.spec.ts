import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadGpxButtonComponent } from './download-gpx-button.component';

describe('DownloadGpxButtonComponent', () => {
  let component: DownloadGpxButtonComponent;
  let fixture: ComponentFixture<DownloadGpxButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadGpxButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadGpxButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
