import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-message-box',
  templateUrl: './message-box.component.html',
  styleUrls: ['./message-box.component.scss'],
})
export class MessageBoxComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  private dialogRef: MatDialogRef<any>;

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

  get jusCon() {
    return this.data.jusCon;
  }

  get confirmBtnColor() {
    return this.data.confirmBtnColor;
  }

  constructor(
    private router: Router,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {}

  ngOnInit() {
    this.getDialogRef();
  }

  /**
   * 取得DialogRef
   */
  getDialogRef() {
    this.dialog.afterOpened
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((dialogRef: MatDialogRef<any>) => {
        this.dialogRef = dialogRef;
      });
  }

  /**
   * 確認
   */
  handleConfirm() {
    if (this.onConfirm) {
      this.onConfirm();
    }

    this.closeDialog();
  }

  /**
   * 取消
   */
  handleCancel() {
    if (this.onCancel) {
      this.onCancel();
    }

    this.closeDialog();
  }

  /**
   * 關閉dialog
   */
  closeDialog() {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.dialog.closeAll();
    }
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
