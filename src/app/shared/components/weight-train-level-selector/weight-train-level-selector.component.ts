import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { WeightTrainingLevel } from '../../enum/weight-train';
import { Subject, Subscription, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-weight-train-level-selector',
  templateUrl: './weight-train-level-selector.component.html',
  styleUrls: ['./weight-train-level-selector.component.scss']
})
export class WeightTrainLevelSelectorComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject;
  private clickEventSubscription = new Subscription;

  /**
   * 顯示訓練程度選單與否
   */
  showLevelSelector = false;

  /**
   * 重訓程度
   */
  weightTrainLevel: WeightTrainingLevel = WeightTrainingLevel.metacarpus;


  readonly WeightTrainingLevel = WeightTrainingLevel;

  constructor(
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.weightTrainLevel = this.userService.getUser().userProfile.weightTrainingStrengthLevel;
  }

  /**
   * 變更重訓程度
   */
  changeLevel(level: WeightTrainingLevel) {
    this.weightTrainLevel = level;
    this.userService.updateUserProfile({ weightTrainingStrengthLevel: level }).subscribe();
    this.unSubscribeClickEvent();
  }

  /**
   * 顯示重訓程度選單與否
   * @param e {MouseEvent}
   */
  handleShowLevelSelector(e: MouseEvent) {
    e.stopPropagation();
    this.showLevelSelector ? this.unSubscribeClickEvent() : this.subscribeClickEvent();
  }

  /**
   * 訂閱點擊事件
   */
  subscribeClickEvent() {
    this.showLevelSelector = true;
    const clickEvent = fromEvent(document, 'click');
    this.clickEventSubscription = clickEvent.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.unSubscribeClickEvent();
    });

  }

  /**
   * 取消訂閱點擊事件
   */
  unSubscribeClickEvent() {
    this.showLevelSelector = false;
    this.clickEventSubscription.unsubscribe();
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
