import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrZoneHintComponent } from './hr-zone-hint.component';

describe('HrZoneHintComponent', () => {
  let component: HrZoneHintComponent;
  let fixture: ComponentFixture<HrZoneHintComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HrZoneHintComponent],
    });
    fixture = TestBed.createComponent(HrZoneHintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
