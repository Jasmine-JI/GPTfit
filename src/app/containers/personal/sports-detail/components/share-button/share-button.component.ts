import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LoadingMaskComponent, ShareBoxComponent } from '../../../../../components';
import { AuthService, Api21xxService } from '../../../../../core/services';
import { allPrivacyItem } from '../../../../../core/models/const';
import { Api2114Post } from '../../../../../core/models/api/api-21xx';
import { PrivacyEditObj, RangeType } from '../../../../../core/enums/api';
import { appPath } from '../../../../../app-path.const';

@Component({
  selector: 'app-share-button',
  standalone: true,
  imports: [CommonModule, TranslateModule, LoadingMaskComponent, ShareBoxComponent],
  templateUrl: './share-button.component.html',
  styleUrls: ['../../sports-detail.component.scss', './share-button.component.scss'],
})
export class ShareButtonComponent {
  @Input() fileId: number;
  @Input() title: string;

  /**
   * 顯示開放隱私權提示框與否
   */
  displayAlert = false;

  /**
   * 顯示分享框與否
   */
  displayShareBox = false;

  /**
   * 分享連結
   */
  link: string;

  /**
   * debug mode用連結
   */
  debugLink: string;

  constructor(private authService: AuthService, private api21xxService: Api21xxService) {}

  /**
   * 顯示開放隱私權提示框
   */
  showAlert() {
    this.displayAlert = true;
  }

  /**
   * 不變更隱私權並關閉隱藏提示框
   */
  cancel() {
    this.displayAlert = false;
  }

  /**
   * 將檔案隱私權變更為開放給所有人
   */
  updatePrivacy() {
    const body: Api2114Post = {
      token: this.authService.token,
      editFileType: PrivacyEditObj.file,
      rangeType: RangeType.fileId,
      editFileId: [this.fileId],
      privacy: [...allPrivacyItem],
    };

    this.api21xxService.fetchEditPrivacy(body).subscribe({
      next: () => this.showSharedBox(),
      error: (err) => console.error(err),
    });
  }

  /**
   * 顯示分享框
   */
  showSharedBox() {
    this.displayAlert = false;
    const { origin } = location;
    this.link = `${origin}/${appPath.personal.activityDetail}/${this.fileId}`;
    this.debugLink = `${this.link}?debug=`;
    this.displayShareBox = true;
  }

  /**
   * 關閉分享框
   */
  closeSharedBox() {
    this.displayShareBox = false;
  }
}
