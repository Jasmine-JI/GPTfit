import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  Output,
  EventEmitter,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { fromEvent, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PaginationSetting } from '../../shared/models/pagination';
import { deepCopy } from '../../core/utils';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule],
})
export class PaginationComponent implements OnInit, OnDestroy, OnChanges {
  @Output() pageChange = new EventEmitter();
  @Input() onePageSizeOpt: Array<number> = [5, 10, 15];
  @Input() pageSetting: PaginationSetting = {
    totalCounts: 0,
    pageIndex: 0,
    onePageSize: 10,
  };

  private ngUnsubscribe = new Subject();
  clickEvent: Subscription;
  showPageSizeMenu = false;

  pageSettingObj: PaginationSetting;
  debounce: any;

  constructor() {}

  ngOnInit() {}

  ngOnChanges(): void {
    this.pageSettingObj = deepCopy(this.pageSetting);
  }

  /**
   * 顯示一頁顯示項數選單
   * @param e {MouseEvent}
   */
  showPageSizeOpt(e: MouseEvent) {
    e.stopPropagation();
    if (this.showPageSizeMenu) {
      this.showPageSizeMenu = false;
      this.clickEvent.unsubscribe();
    } else {
      this.showPageSizeMenu = true;
      this.subscribeClickEvent();
    }
  }

  /**
   * 訂閱全域點擊事件
   */
  subscribeClickEvent() {
    const click = fromEvent(document, 'click');
    this.clickEvent = click.pipe(takeUntil(this.ngUnsubscribe)).subscribe((e) => {
      this.showPageSizeMenu = false;
      this.clickEvent.unsubscribe();
    });
  }

  /**
   * 切換頁碼
   */
  switchPage(action: 'pre' | 'next') {
    if (action === 'pre') {
      if (this.pageSettingObj.pageIndex > 0) {
        this.pageSettingObj.pageIndex--;
      }
    } else {
      const { totalCounts, onePageSize, pageIndex } = this.pageSettingObj;
      if ((pageIndex + 1) * onePageSize < totalCounts) {
        this.pageSettingObj.pageIndex++;
      }
    }

    // 避免快速切換造成太過頻繁call api
    if (this.debounce) {
      clearTimeout(this.debounce);
    }

    this.debounce = setTimeout(() => {
      this.emitPageSetting();
    }, 250);
  }

  /**
   * 變更單頁顯示項數
   * @param size {number}-單一頁所顯示項數
   */
  changeOnePageSize(size: number) {
    this.pageSettingObj.onePageSize = size;
    this.pageSettingObj.pageIndex = 0;
    this.emitPageSetting();
  }

  /**
   * 向父組件傳遞頁碼設定
   */
  emitPageSetting() {
    this.pageChange.emit(this.pageSettingObj);
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
