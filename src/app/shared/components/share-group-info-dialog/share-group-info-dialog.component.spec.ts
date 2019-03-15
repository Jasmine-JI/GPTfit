import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareGroupInfoDialogComponent } from './share-group-info-dialog.component';

describe('ShareGroupInfoDialogComponent', () => {
  let component: ShareGroupInfoDialogComponent;
  let fixture: ComponentFixture<ShareGroupInfoDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShareGroupInfoDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShareGroupInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
