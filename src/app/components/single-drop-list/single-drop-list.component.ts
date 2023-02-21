import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ListItem, SingleLayerList } from '../../core/models/compo';
import { Subject, Subscription, fromEvent, merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-single-drop-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './single-drop-list.component.html',
  styleUrls: ['./single-drop-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SingleDropListComponent implements OnInit, OnChanges, OnDestroy {
  private ngUnsubscribe = new Subject();
  private plureEventSubscription = new Subscription();

  /**
   * 現在選擇的項目
   */
  currentSelect = {
    title: null,
    content: null,
  };

  /**
   * 顯示下拉選單與否
   */
  showDropList = false;

  @Input() dropList: Array<SingleLayerList>;
  @Input() defaultSelectIndex: [number, number] = [0, 0];
  @Input() maxWidth = 200;
  @Output() selectItem = new EventEmitter<[number, number]>();

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {}

  /**
   * 取得下拉選單內容時，先給預設選擇選項
   * @param changes {SimpleChanges}-input change event
   */
  ngOnChanges(changes: SimpleChanges): void {
    const { dropList } = this;
    if (dropList && dropList.length > 0) {
      const [firstIndex, secondIndex] = this.defaultSelectIndex;
      this.selectListItem(firstIndex, secondIndex);
    }
  }

  /**
   * 選擇選單中的選項
   * @param firstIndex {number}-選項類別序列
   * @param secondIndex {number}-選項序列
   * @param e {MouseEvent}
   */
  selectListItem(firstIndex: number, secondIndex: number, e?: MouseEvent) {
    if (e) e.stopPropagation();
    const { list, id: typeId, titleKey } = this.dropList[firstIndex];
    const { textKey, id: itemId } = list[secondIndex];
    this.currentSelect = { title: titleKey ?? null, content: textKey };
    this.selectItem.emit([typeId ?? firstIndex, itemId ?? secondIndex]);
    this.closeDropList();
  }

  /**
   * 展開下拉式選單
   */
  openDropList() {
    this.showDropList = true;
    this.subscribePlureEvent();
  }

  /**
   * 收起下拉式選單
   */
  closeDropList() {
    this.showDropList = false;
    this.unSubscribePlureEvent();
  }

  /**
   * 開關下拉式選單
   * @param e {MouseEvent}
   */
  toggleDropList(e: MouseEvent) {
    e.stopPropagation();
    this.showDropList ? this.closeDropList() : this.openDropList();
  }

  /**
   * 訂閱點擊與滾動事件
   */
  subscribePlureEvent() {
    const scrollElement = document.querySelector('.main-body');
    const scrollEvent = fromEvent(scrollElement, 'scroll');
    const clickEvent = fromEvent(window, 'click');
    this.plureEventSubscription = merge(scrollEvent, clickEvent)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.showDropList = false;
        this.unSubscribePlureEvent();
        this.changeDetectorRef.markForCheck();
      });
  }

  /**
   * 取消訂閱點擊與滾動事件
   */
  unSubscribePlureEvent() {
    if (this.plureEventSubscription) this.plureEventSubscription.unsubscribe();
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy(): void {
    this.unSubscribePlureEvent();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
