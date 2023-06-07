import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppCompressDataComponent } from './app-compress-data.component';

describe('AppCompressDataComponent', () => {
  let component: AppCompressDataComponent;
  let fixture: ComponentFixture<AppCompressDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppCompressDataComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppCompressDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
