import { Component, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Subscription, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';
import { UserService } from '../../core/services/user.service';
import { HrZoneRange } from '../../core/models/compo/chart-data.model';
import { HrBase } from '../../core/enums/sports';

@Component({
  selector: 'app-hr-zone-hint',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './hr-zone-hint.component.html',
  styleUrls: ['./hr-zone-hint.component.scss'],
})
export class HrZoneHintComponent implements OnDestroy {
  /**
   * 此頁面是否為登入者所持有
   */
  @Input() isPageOwner = true;

  /**
   * 解除rxjs訂閱用
   */
  private _ngUnSubscribe = new Subject();

  /**
   * 點擊事件訂閱者
   */
  private _clickEventSubscription = new Subscription();

  /**
   * 是否顯示說明框
   */
  displayDialog = false;

  /**
   * 心率區間
   */
  userHrZone: HrZoneRange = {
    hrBase: HrBase.max,
    z0: 0,
    z1: 0,
    z2: 0,
    z3: 0,
    z4: 0,
    z5: 0,
  };

  /**
   * 心率法
   */
  readonly HrBase = HrBase;

  constructor(private userService: UserService) {}

  /**
   * 顯示或關閉說明框
   * @param e 點擊事件
   */
  toggleDialog(e: MouseEvent) {
    e.stopPropagation();
    const { displayDialog } = this;
    displayDialog ? this.hideDialog() : this.showDialog();
  }

  /**
   * 顯示說明框
   */
  showDialog() {
    this.displayDialog = true;
    if (this.isPageOwner) this.getHrZone();
    this.subscribeClickEvent();
  }

  /**
   * 隱藏說明框
   */
  hideDialog() {
    this.displayDialog = false;
    this._clickEventSubscription?.unsubscribe();
  }

  /**
   * 計算心率區間
   */
  getHrZone() {
    this.userHrZone = this.userService.getUser().userHrRange;
  }

  /**
   * 訂閱點擊與滾動事件，以關閉視窗
   */
  subscribeClickEvent() {
    this._clickEventSubscription = fromEvent(document, 'click')
      .pipe(takeUntil(this._ngUnSubscribe))
      .subscribe(() => {
        this.hideDialog();
      });
  }

  /**
   * 取消訂閱rxjs
   */
  ngOnDestroy(): void {
    this._ngUnSubscribe.next(null);
    this._ngUnSubscribe.complete();
  }
}
