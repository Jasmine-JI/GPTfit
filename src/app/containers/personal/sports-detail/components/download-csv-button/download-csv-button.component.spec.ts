import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadCsvButtonComponent } from './download-csv-button.component';

describe('DownloadCsvButtonComponent', () => {
  let component: DownloadCsvButtonComponent;
  let fixture: ComponentFixture<DownloadCsvButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadCsvButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadCsvButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
