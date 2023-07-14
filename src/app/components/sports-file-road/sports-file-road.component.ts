import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SportType } from '../../core/enums/sports';
import {
  SportTypeIconPipe,
  SportTimePipe,
  SportPaceSibsPipe,
  SpeedPaceUnitPipe,
  GetSplitStringPipe,
} from '../../core/pipes';
import { FileSimpleInfo } from '../../core/models/compo';
import { DataUnitType } from '../../core/enums/common';

const scrollDisplacement = 145;

@Component({
  selector: 'app-sports-file-road',
  templateUrl: './sports-file-road.component.html',
  styleUrls: ['./sports-file-road.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    SportTypeIconPipe,
    SportTimePipe,
    SportPaceSibsPipe,
    SpeedPaceUnitPipe,
    GetSplitStringPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SportsFileRoadComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() fileList: Array<FileSimpleInfo> = [];
  @Input() userUnit: DataUnitType;
  @Output() selectFile: EventEmitter<number> = new EventEmitter();

  /**
   * 現在聚焦的分段索引
   */
  currentIndex = 0;

  /**
   * 視界觀察Api
   */
  intersectionObserver: IntersectionObserver;

  /**
   * 檔案路徑是否可以往前捲動
   */
  canSwitchPrev = false;

  /**
   * 檔案路徑是否可以往後捲動
   */
  canSwitchNext = true;

  readonly SportType = SportType;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.createIntersectionObserver();
  }

  /**
   * 建立 IntersectionObserver，並觀察路徑清單第一個項目與最後一個項目
   */
  createIntersectionObserver() {
    const options = {
      root: document.querySelector('.list__container'),
      rootMargin: '10px',
      threshold: 1,
    };

    this.intersectionObserver = new IntersectionObserver(this.handleListSwitch.bind(this), options);
    const targetElementList = document.querySelectorAll('.list__button');
    const firstElement = targetElementList[0];
    const lastElement = targetElementList[targetElementList.length - 1];
    this.intersectionObserver.observe(firstElement);
    this.intersectionObserver.observe(lastElement);
  }

  /**
   * 處理清單滾動的視界事件
   */
  handleListSwitch(entries: Array<IntersectionObserverEntry>) {
    entries.forEach((_entries) => {
      const { isIntersecting, target } = _entries;
      const isFirstTarget = +(target.getAttribute('data-index') ?? 0) === 0;
      if (isFirstTarget) {
        this.canSwitchPrev = !isIntersecting;
      } else {
        this.canSwitchNext = !isIntersecting;
      }

      this.changeDetectorRef.markForCheck();
    });
  }

  /**
   * 選擇特定的檔案資訊
   * @param index {number}-指定的檔案索引
   */
  selectAssignFile(index: number) {
    if (index !== this.currentIndex) {
      this.currentIndex = index;
      this.selectFile.emit(index);
    }
  }

  /**
   * 將檔案資訊列表向左滑動
   */
  scrollLeft() {
    if (this.canSwitchNext) {
      const scrollPosition = this.getScrollPosition();
      const scrollElement = document.querySelector('.list__container');
      scrollElement?.scroll(scrollPosition + scrollDisplacement, 0);
      this.changeDetectorRef.markForCheck();
    }
  }

  /**
   * 將檔案資訊列表向右滑動
   */
  scrollRight() {
    if (this.canSwitchPrev) {
      const scrollPosition = this.getScrollPosition();
      const scrollElement = document.querySelector('.list__container');
      scrollElement?.scroll(scrollPosition - scrollDisplacement, 0);
      this.changeDetectorRef.markForCheck();
    }
  }

  /**
   * 取得目前scroll bar位置
   */
  getScrollPosition() {
    const targetElement = document.querySelector('.list__container');
    return targetElement?.scrollLeft ?? 0;
  }

  /**
   * 取消訂閱 intersectionObserver 觀察事件
   */
  ngOnDestroy(): void {
    this.intersectionObserver.disconnect();
  }
}
