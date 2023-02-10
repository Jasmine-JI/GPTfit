import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsideIndexBoxComponent } from './aside-index-box.component';

describe('AsideIndexBoxComponent', () => {
  let component: AsideIndexBoxComponent;
  let fixture: ComponentFixture<AsideIndexBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsideIndexBoxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AsideIndexBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
