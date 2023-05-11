import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareBoxComponent } from './share-box.component';

describe('ShareBoxComponent', () => {
  let component: ShareBoxComponent;
  let fixture: ComponentFixture<ShareBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShareBoxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShareBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
