import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Top3DialogComponent } from './top3-dialog.component';

describe('Top3DialogComponent', () => {
  let component: Top3DialogComponent;
  let fixture: ComponentFixture<Top3DialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Top3DialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Top3DialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
