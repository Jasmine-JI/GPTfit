import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplyActivityComponent } from './apply-activity.component';

describe('ApplyActivityComponent', () => {
  let component: ApplyActivityComponent;
  let fixture: ComponentFixture<ApplyActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplyActivityComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplyActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
