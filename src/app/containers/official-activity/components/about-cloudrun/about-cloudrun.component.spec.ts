import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutCloudrunComponent } from './about-cloudrun.component';

describe('AboutCloudrunComponent', () => {
  let component: AboutCloudrunComponent;
  let fixture: ComponentFixture<AboutCloudrunComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AboutCloudrunComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutCloudrunComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
