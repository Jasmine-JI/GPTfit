import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InnerSettingsComponent } from './inner-settings.component';

describe('InnerSettingsComponent', () => {
  let component: InnerSettingsComponent;
  let fixture: ComponentFixture<InnerSettingsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [InnerSettingsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InnerSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
