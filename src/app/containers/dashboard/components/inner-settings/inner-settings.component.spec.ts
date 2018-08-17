import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InnerSettingsComponent } from './inner-settings.component';

describe('InnerSettingsComponent', () => {
  let component: InnerSettingsComponent;
  let fixture: ComponentFixture<InnerSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InnerSettingsComponent ]
    })
    .compileComponents();
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
