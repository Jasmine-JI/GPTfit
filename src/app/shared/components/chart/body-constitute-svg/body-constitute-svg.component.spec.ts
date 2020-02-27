import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BodyConstituteSvgComponent } from './body-constitute-svg.component';

describe('BodyConstituteSvgComponent', () => {
  let component: BodyConstituteSvgComponent;
  let fixture: ComponentFixture<BodyConstituteSvgComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BodyConstituteSvgComponent ]
    })
    .compileComponents();
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
