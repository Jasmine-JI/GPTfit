import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleDropListComponent } from './single-drop-list.component';

describe('SingleDropListComponent', () => {
  let component: SingleDropListComponent;
  let fixture: ComponentFixture<SingleDropListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingleDropListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SingleDropListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
