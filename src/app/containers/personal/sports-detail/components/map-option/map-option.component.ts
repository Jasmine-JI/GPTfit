import { Component, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapSource } from '../../../../../core/enums/compo';
import { Subject, Subscription, fromEvent, merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-map-option',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-option.component.html',
  styleUrls: ['./map-option.component.scss', '../../sports-detail.component.scss'],
})
export class MapOptionComponent implements OnDestroy {
  private ngUnsubscribe = new Subject();
  private pluralEvent = new Subscription();

  /**
   * 圖資來源
   */
  @Input() source = MapSource.google;

  /**
   * 圖資變更傳遞事件
   */
  @Output() mapSourceChange: EventEmitter<MapSource> = new EventEmitter();

  /**
   * 顯示設定與否
   */
  displayOptional = false;

  readonly MapSource = MapSource;

  /**
   * 顯示或隱藏地圖選項
   * @param e 點擊事件
   */
  toogleOptional(e: MouseEvent) {
    e.stopPropagation();
    const { displayOptional } = this;
    if (displayOptional) {
      this.hideOptional();
    } else {
      this.showOptional();
    }
  }

  /**
   * 關閉設定框，並取消訂閱事件
   */
  hideOptional() {
    this.displayOptional = false;
    if (this.pluralEvent) this.pluralEvent.unsubscribe();
  }

  /**
   * 關閉設定框，並訂閱事件
   */
  showOptional() {
    this.displayOptional = true;
    this.pluralEvent = this.subscribePluralEvent().subscribe(() => {
      this.hideOptional();
    });
  }

  /**
   * 訂閱複數事件以關閉選單
   */
  subscribePluralEvent() {
    const scrollTarget = document.querySelector('.main__container');
    const scrollEvent = fromEvent(scrollTarget, 'scroll');
    const clickEvent = fromEvent(window, 'click');
    return merge(scrollEvent, clickEvent).pipe(takeUntil(this.ngUnsubscribe));
  }

  /**
   * 變更圖資來源
   * @param mapSource 圖資來源
   */
  changeMapSource(mapSource: MapSource) {
    const { source } = this;
    if (mapSource !== source) {
      this.source = mapSource;
      this.mapSourceChange.emit(mapSource);
      this.hideOptional();
    }
  }

  /**
   * 取消訂閱rxjs
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
