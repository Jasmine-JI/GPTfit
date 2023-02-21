import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageRoadPathComponent } from './page-road-path.component';

describe('PageRoadPathComponent', () => {
  let component: PageRoadPathComponent;
  let fixture: ComponentFixture<PageRoadPathComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageRoadPathComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PageRoadPathComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
