import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-return-button',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './return-button.component.html',
  styleUrls: ['../../sports-detail.component.scss', './return-button.component.scss'],
})
export class ReturnButtonComponent {
  /**
   * 取消比較模式事件傳遞
   */
  @Output() cancelFileCompare = new EventEmitter<boolean>();

  /**
   * 取消比較模式
   */
  cancelCompareMode() {
    this.cancelFileCompare.emit(true);
  }
}
