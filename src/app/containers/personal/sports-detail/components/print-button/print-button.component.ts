import { Component, Input } from '@angular/core';
import { QueryString } from '../../../../../core/enums/common';

@Component({
  selector: 'app-print-button',
  standalone: true,
  templateUrl: './print-button.component.html',
  styleUrls: ['../../sports-detail.component.scss', './print-button.component.scss'],
})
export class PrintButtonComponent {
  /**
   * 運動檔案流水編號
   */
  @Input() fileId: number;

  /**
   * 開一個新的分頁顯示預覽列印頁面
   */
  navigatePrintPage() {
    const previewUrl = this.getPreviewUrl();
    window.open(previewUrl, '_blank', 'noopener=yes,noreferrer=yes');
  }

  /**
   * 根據使用者圖表設定取得預覽列印網址
   */
  getPreviewUrl() {
    const { href } = location;
    return `${href}?${QueryString.printMode}=s`;
  }

  /**
   * 列印
   */
  printPage() {
    window.print();
  }
}
