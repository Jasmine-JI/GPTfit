import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CloudRunGpxComponent } from './cloud-run-gpx.component';

describe('CloudRunGpxComponent', () => {
  let component: CloudRunGpxComponent;
  let fixture: ComponentFixture<CloudRunGpxComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CloudRunGpxComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudRunGpxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
