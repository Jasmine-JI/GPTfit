import { Component, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { QRCodeModule } from 'angularx-qrcode';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../core/services';
import { AccessRight } from '../../core/enums/common';

@Component({
  selector: 'app-share-box',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatIconModule, QRCodeModule],
  templateUrl: './share-box.component.html',
  styleUrls: ['./share-box.component.scss'],
})
export class ShareBoxComponent implements OnChanges {
  @Input() link: string;
  @Input() debugLink: string;
  @Input() title: string;

  @Output() closeBox = new EventEmitter();

  /**
   * 登入者權限
   */
  accessRight = AccessRight.guest;

  /**
   * 使用者權限清單
   */
  readonly AccessRight = AccessRight;

  /**
   * 瀏覽器是否支援分享功能
   * （因大部分電腦不支援但無法使用navigator.share區別，故使用關鍵字剔除 Windows 系統）
   */
  readonly canShare = navigator.share && !navigator.userAgent.includes('Windows');

  constructor(private snackBar: MatSnackBar, private userservice: UserService) {}

  ngOnChanges() {
    this.accessRight = this.userservice.getUser().systemAccessright;
  }

  /**
   * 複製連結至剪貼簿
   */
  copyLink(inputElement) {
    navigator.clipboard
      ? this.copyLinkByClipboard(this.link)
      : this.copyLinkByExecCommand(inputElement);
  }

  /**
   * 複製 debug 連結至剪貼簿（限有支援debug mode的頁面）
   */
  copyDebugLink(inputElement) {
    navigator.clipboard
      ? this.copyLinkByClipboard(this.debugLink)
      : this.copyLinkByExecCommand(inputElement);
  }

  /**
   * 使用 navigator.clipboard 複製連結至剪貼簿
   * @param link 欲複製的連結
   */
  copyLinkByClipboard(link: string) {
    navigator.clipboard
      .writeText(link)
      .then(() => this.showMsg())
      .catch((error) => {
        this.showMsg('Failed !');
        console.error(error);
      });
  }

  /**
   * 使用 document.execCommand 複製連結至剪貼簿
   * （document.execCommand 將廢棄，
   * 但 navigator.clipboard 僅支援 iOS 13.1 以上，
   * 故保留此方法）
   * @param inputElement
   */
  copyLinkByExecCommand(inputElement) {
    const isiOS = navigator.userAgent.match(/ipad|iphone/i);
    if (isiOS) {
      const range = document.createRange();
      range.selectNodeContents(inputElement);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      inputElement.select();
    }

    inputElement.setSelectionRange(0, 99999);
    document.execCommand('copy');
    this.showMsg();
  }

  /**
   * 顯示複製成功訊息
   * @msg 顯示訊息
   */
  showMsg(msg = 'Copied !') {
    this.snackBar.open(msg, 'OK', { duration: 2000 });
  }

  /**
   * 使用裝置原生分享功能
   */
  shareLink() {
    const { link, title } = this;
    const shareData = {
      title,
      text: title,
      url: link,
      files: [],
    };

    navigator
      .share(shareData)
      .then(() => this.showMsg('Shared !'))
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * 關閉分享框
   */
  closeShareBox() {
    this.closeBox.emit();
  }
}
