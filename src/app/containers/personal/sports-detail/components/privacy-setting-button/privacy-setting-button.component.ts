import { Component, OnChanges, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SportsFileInfo, Api2114Post } from '../../../../../core/models/api/api-21xx';
import { PrivacyObj, PrivacyEditObj, RangeType } from '../../../../../core/enums/api';
import { AuthService, Api21xxService } from '../../../../../core/services';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingMaskComponent } from '../../../../../components';

@Component({
  selector: 'app-privacy-setting-button',
  standalone: true,
  imports: [CommonModule, TranslateModule, LoadingMaskComponent],
  templateUrl: './privacy-setting-button.component.html',
  styleUrls: ['../../sports-detail.component.scss', './privacy-setting-button.component.scss'],
})
export class PrivacySettingButtonComponent implements OnChanges {
  @Input() fileInfo: SportsFileInfo;

  /**
   * 是否正在讀取
   */
  isLoading = false;

  /**
   * 是否顯示隱私權設定框
   */
  displayBox = false;

  /**
   * 隱私權設定
   */
  setting = new Set([PrivacyObj.self]);

  readonly PrivacyObj = PrivacyObj;

  constructor(
    private authService: AuthService,
    private api21xxService: Api21xxService,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  ngOnChanges(): void {
    if (this.fileInfo) {
      const originPrivacy = this.fileInfo.privacy.map((_privacy) => +_privacy);
      this.inputOriginSetting(originPrivacy);
    }
  }

  /**
   * 將檔案原有隱私權設定寫入set物件供編輯使用
   * @param privacy
   */
  inputOriginSetting(privacy: Array<PrivacyObj>) {
    privacy.forEach((_privacy) => {
      this.addObject(_privacy);
    });
  }

  /**
   * 顯示隱私權設定框
   */
  showEditBox() {
    if (this.fileInfo) this.displayBox = true;
  }

  /**
   * 取消編輯
   */
  cancelEdit() {
    this.displayBox = false;
  }

  /**
   * 更新隱私權設定
   */
  updatePrivacy() {
    this.isLoading = true;
    const body: Api2114Post = {
      token: this.authService.token,
      editFileType: PrivacyEditObj.file,
      rangeType: RangeType.fileId,
      editFileId: [this.fileInfo.fileId],
      privacy: Array.from(this.setting),
    };

    this.api21xxService.fetchEditPrivacy(body).subscribe({
      next: () => this.handleUpdateSuccess(),
      error: () => this.handleUpdateFailed(),
    });
  }

  /**
   * 更新成功
   */
  handleUpdateSuccess() {
    this.showEditResultMsg('universal_status_updateCompleted');
    this.displayBox = false;
    this.isLoading = false;
  }

  /**
   * 更新失敗
   */
  handleUpdateFailed() {
    this.showEditResultMsg('universal_popUpMessage_updateFailed');
    this.isLoading = false;
  }

  /**
   * 顯示編輯結果訊息
   * @param msgKey 訊息翻譯鍵名
   */
  showEditResultMsg(msgKey: string) {
    const msg = this.translate.instant(msgKey);
    this.snackBar.open(msg, 'OK', { duration: 1000 });
  }

  /**
   * 批次變更隱私權設定
   */
  batchChangePrivacy() {
    const isAddingAll = !this.setting.has(PrivacyObj.onlyGroupAdmin);
    if (isAddingAll) {
      this.setting.add(PrivacyObj.onlyGroupAdmin);
      this.setting.add(PrivacyObj.myGroup);
      this.setting.add(PrivacyObj.anyone);
    } else {
      this.setting.clear();
      this.setting.add(PrivacyObj.self);
    }
  }

  /**
   * 變更隱私權設定
   * @param object
   */
  changePrivacy(object: PrivacyObj) {
    const isAddingObject = !this.setting.has(object);
    isAddingObject ? this.addObject(object) : this.deleteObject(object);
  }

  /**
   * 隱私權加入開放對象
   * @param object 隱私權開放對象
   */
  addObject(object: PrivacyObj) {
    switch (object) {
      case PrivacyObj.self:
      case PrivacyObj.onlyGroupAdmin:
        break;
      case PrivacyObj.myGroup:
        this.setting.add(PrivacyObj.onlyGroupAdmin);
        break;
      default:
        this.setting.add(PrivacyObj.onlyGroupAdmin);
        this.setting.add(PrivacyObj.myGroup);
        break;
    }

    this.setting.add(object);
  }

  /**
   * 隱私權移除開放對象
   * @param object 隱私權移除對象
   */
  deleteObject(object: PrivacyObj) {
    switch (object) {
      case PrivacyObj.onlyGroupAdmin:
        this.setting.delete(PrivacyObj.anyone);
        this.setting.delete(PrivacyObj.myGroup);
        break;
      case PrivacyObj.myGroup:
        this.setting.delete(PrivacyObj.anyone);
        break;
    }

    this.setting.delete(object);
  }
}
