import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoDataImageComponent } from './info-data-image.component';

describe('InfoDataImageComponent', () => {
  let component: InfoDataImageComponent;
  let fixture: ComponentFixture<InfoDataImageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InfoDataImageComponent],
    });
    fixture = TestBed.createComponent(InfoDataImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
