import { Component } from '@angular/core';
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
   * 關閉視窗或返回上一頁
   */
  turnBack() {
    window.close();
    window.history.back();
  }
}
