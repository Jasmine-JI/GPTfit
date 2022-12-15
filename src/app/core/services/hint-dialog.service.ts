import { Injectable } from '@angular/core';
import { MessageBoxComponent } from '../../shared/components/message-box/message-box.component';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class HintDialogService {
  constructor(
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private translate: TranslateService
  ) {}

  /**
   * 跳出提示視窗
   * @param msg {string}-欲顯示的訊息
   */
  openAlert(msg: string) {
    this.translate.get('hellow world').subscribe(() => {
      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'Message',
          body: msg,
          confirmText: this.translate.instant('universal_operating_confirm'),
        },
      });
    });
  }

  /**
   * 跳出snackbar
   * @param msg {string}-欲顯示的訊息
   * @author kidin-1101203
   */
  showSnackBar(msg: string) {
    this.snackbar.open(msg, 'OK', { duration: 3000 });
  }
}
