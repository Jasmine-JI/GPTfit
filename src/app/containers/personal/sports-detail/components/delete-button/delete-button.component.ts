import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService, Api21xxService } from '../../../../../core/services';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { LoadingMaskComponent } from '../../../../../components';

@Component({
  selector: 'app-delete-button',
  standalone: true,
  imports: [CommonModule, TranslateModule, LoadingMaskComponent],
  templateUrl: './delete-button.component.html',
  styleUrls: ['../../sports-detail.component.scss', './delete-button.component.scss'],
})
export class DeleteButtonComponent {
  /**
   * 運動檔案流水編號
   */
  @Input() fileId: number;

  /**
   * 顯示刪除警告標語與否
   */
  displayAlert = false;

  /**
   * 是否正在刪除中
   */
  isLoading = false;

  constructor(
    private authService: AuthService,
    private api21xxService: Api21xxService,
    private translate: TranslateService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  /**
   * 顯示刪除警告提示
   */
  showAlert() {
    this.displayAlert = true;
  }

  /**
   * 隱藏刪除警告提示
   */
  hideAlert() {
    this.displayAlert = false;
  }

  /**
   * 刪除運動檔案
   */
  deleteSportsFile() {
    this.hideAlert();
    const body = {
      token: this.authService.token,
      fileId: [this.fileId],
    };

    this.isLoading = true;
    this.api21xxService.fetchDeleteActivityData(body).subscribe({
      next: () => this.handleDeleteSuccess(),
      error: () => this.handleDeleteFailed(),
    });
  }

  /**
   * 刪除成功後返回運動列表
   */
  handleDeleteSuccess() {
    this.isLoading = false;
    const msgKey = 'universal_status_updateCompleted';
    this.showMsg(msgKey);
    this.router.navigateByUrl('/dashboard/activity-list');
  }

  /**
   * 刪除失敗，顯示錯誤訊息
   */
  handleDeleteFailed() {
    this.isLoading = false;
    const msgKey = 'universal_popUpMessage_updateFailed';
    this.showMsg(msgKey);
  }

  /**
   * 顯示訊息
   * @param msgKey 訊息的翻譯鍵名
   */
  showMsg(msgKey: string) {
    const msg = this.translate.instant(msgKey);
    this.snackBar.open(msg, 'OK', { duration: 1000 });
  }
}
