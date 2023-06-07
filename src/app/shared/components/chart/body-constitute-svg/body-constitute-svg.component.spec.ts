import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BodyConstituteSvgComponent } from './body-constitute-svg.component';

describe('BodyConstituteSvgComponent', () => {
  let component: BodyConstituteSvgComponent;
  let fixture: ComponentFixture<BodyConstituteSvgComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BodyConstituteSvgComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BodyConstituteSvgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
