import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureNounTipsComponent } from './feature-noun-tips.component';

describe('FeatureNounTipsComponent', () => {
  let component: FeatureNounTipsComponent;
  let fixture: ComponentFixture<FeatureNounTipsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FeatureNounTipsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureNounTipsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
