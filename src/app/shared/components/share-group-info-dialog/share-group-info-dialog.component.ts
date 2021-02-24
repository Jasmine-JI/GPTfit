import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-share-group-info-dialog',
  templateUrl: './share-group-info-dialog.component.html',
  styleUrls: ['./share-group-info-dialog.component.scss']
})
export class ShareGroupInfoDialogComponent implements OnInit {
  get title() {
    return this.data.title;
  }
  get qrURL() {
    const _url = this.data.url.replace('/dashboard/', '/');
    return _url;
  }

  get shareName() {
    return this.data.shareName;
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

  get debugUrl() {
    return this.data.debugUrl;
  }

  constructor(
    private router: Router,
    private snackbar: MatSnackBar,
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

  copyInputMessage(inputElement) {
    inputElement.select();
    document.execCommand('copy');
    inputElement.setSelectionRange(0, 0);
    this.snackbar.open(
      'Copied!!',
      'OK',
      { duration: 3000 }
    );
    
  }

}
