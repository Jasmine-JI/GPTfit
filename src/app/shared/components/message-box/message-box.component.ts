import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-message-box',
  templateUrl: './message-box.component.html',
  styleUrls: ['./message-box.component.css']
})
export class MessageBoxComponent implements OnInit {
  get title() {
    return this.data.title;
  }

  get body() {
    return this.data.body;
  }

  get onConfirm() {
    return this.data.onConfirm;
  }
  get onCancel() {
    return this.data.onCancel;
  }
  get confirmText() {
    return this.data.confirmText;
  }
  get cancelText() {
    return this.data.cancelText;
  }
  constructor(
    private router: Router,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {}

  ngOnInit() {}
  handleConfirm() {
    if (this.onConfirm) {
      this.onConfirm();
    }
    this.dialog.closeAll();
  }

  handleCancel() {
    if (this.onCancel) {
      this.onCancel();
    }
    this.dialog.closeAll();
  }
}
