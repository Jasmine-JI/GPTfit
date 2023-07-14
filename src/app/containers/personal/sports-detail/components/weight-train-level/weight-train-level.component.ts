import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { UserService } from '../../../../../core/services';
import { Subject, Subscription, fromEvent, merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WeightTrainingLevel } from '../../../../../core/enums/sports';

@Component({
  selector: 'app-weight-train-level',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './weight-train-level.component.html',
  styleUrls: ['./weight-train-level.component.scss', '../../sports-detail.component.scss'],
})
export class WeightTrainLevelComponent implements OnInit, OnDestroy {
  /**
   * 解rxjs訂閱用
   */
  private _ngUnsubscribe = new Subject();

  /**
   * 解除複數事件訂閱用
   */
  private _pluralEvent = new Subscription();

  /**
   * 變更重訓程度時，向父元素傳遞
   */
  @Output() changeLevel = new EventEmitter<WeightTrainingLevel>();

  /**
   * 隱藏設定
   */
  displaySetting = false;

  /**
   * 使用者重訓程度
   */
  currentLevel = WeightTrainingLevel.metacarpus;

  readonly WeightTrainingLevel = WeightTrainingLevel;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.getCurrentLevel();
  }

  /**
   * 取得使用者重訓程度
   */
  getCurrentLevel() {
    this.currentLevel = this.userService.getUser().weightTrainingStrengthLevel;
  }

  /**
   * 顯示重訓程度設定清單與否
   * @param e 點擊事件
   */
  toggleSetting(e: MouseEvent) {
    e.stopPropagation();
    const { displaySetting } = this;
    displaySetting ? this.hideSetting() : this.showSetting();
  }

  /**
   * 關閉設定框，並取消訂閱事件
   */
  hideSetting() {
    this.displaySetting = false;
    if (this._pluralEvent) this._pluralEvent.unsubscribe();
  }

  /**
   * 關閉設定框，並訂閱事件
   */
  showSetting() {
    this.displaySetting = true;
    this._pluralEvent = this.subscribePluralEvent().subscribe(() => {
      this.hideSetting();
    });
  }

  /**
   * 訂閱複數事件以關閉選單
   */
  subscribePluralEvent() {
    const scrollTarget = document.querySelector('.main__container');
    const scrollEvent = fromEvent(scrollTarget as Element, 'scroll');
    const clickEvent = fromEvent(window, 'click');
    return merge(scrollEvent, clickEvent).pipe(takeUntil(this._ngUnsubscribe));
  }

  /**
   * 設定重訓程度
   * @param e 點擊事件
   * @param level 重訓程度
   */
  setLevel(e: MouseEvent, level: WeightTrainingLevel) {
    e.stopPropagation();
    const { currentLevel } = this;
    if (level !== currentLevel) {
      this.currentLevel = level;
      this.userService.updateUserProfile({ weightTrainingStrengthLevel: level }).subscribe(() => {
        this.changeLevel.emit(level);
      });
    }

    this.hideSetting();
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy(): void {
    this._ngUnsubscribe.next(null);
    this._ngUnsubscribe.complete();
  }
}
