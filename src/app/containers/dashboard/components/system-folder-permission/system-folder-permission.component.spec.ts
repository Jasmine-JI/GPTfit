import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemFolderPermissionComponent } from './system-folder-permission.component';

describe('SystemFolderPermissionComponent', () => {
  let component: SystemFolderPermissionComponent;
  let fixture: ComponentFixture<SystemFolderPermissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SystemFolderPermissionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SystemFolderPermissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
