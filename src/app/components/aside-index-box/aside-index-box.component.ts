import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IndexInfo } from '../../core/models/compo';

@Component({
  selector: 'app-aside-index-box',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './aside-index-box.component.html',
  styleUrls: ['./aside-index-box.component.scss'],
})
export class AsideIndexBoxComponent {
  @Input() indexList: Array<IndexInfo>;
  @Output() scrollToTitle = new EventEmitter<string>();

  /**
   * 點擊索引
   * @param e {MouseEvent}
   * @param elementId {string}-頁面區塊的id
   */
  clickIndex(e: MouseEvent, elementId: string) {
    e.preventDefault();
    this.scrollToTitle.emit(elementId);
  }
}
