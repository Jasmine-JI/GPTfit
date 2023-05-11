import { TestBed } from '@angular/core/testing';

import { SportsDetailService } from './sports-detail.service';

describe('SportsDetailService', () => {
  let service: SportsDetailService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SportsDetailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
