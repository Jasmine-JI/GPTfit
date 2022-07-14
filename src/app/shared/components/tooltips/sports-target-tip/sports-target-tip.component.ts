import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, fromEvent, Subscription, merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-sports-target-tip',
  templateUrl: './sports-target-tip.component.html',
  styleUrls: ['./sports-target-tip.component.scss']
})
export class SportsTargetTipComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();
  private pluralEvent = new Subscription();

  /**
   * ui需要用到的各種flag
   */
  uiFlag = {
    showTargetHint: false
  };

  constructor() { }

  ngOnInit(): void {
  }

  /**
   * 開關運動目標提示
   * @param e {MouseEvent}
   * @author kidin-1110307
   */
  toggleTargetHint(e: MouseEvent) {
    e.stopPropagation();
    const { showTargetHint } = this.uiFlag;
    if (showTargetHint) {
      this.closeTargetHint();
    } else {
      this.openTargetHint();
    }

  }

  /**
   * 顯示運動目標提示
   * @author kidin-1110307
   */
  openTargetHint() {
    this.uiFlag.showTargetHint = true;
    this.listenPluralEvent();
  }

  /**
   * 隱藏運動目標提示
   * @author kidin-1110307
   */
  closeTargetHint() {
    this.uiFlag.showTargetHint = false;
    this.cancelListenPluralEvent();
  }

  /**
   * 偵測全域點擊事件，以收納"群組狀態"選單
   * @author kidin-20201104
   */
  listenPluralEvent() {
    const element = document.querySelector('.main__container');
    const clickEvent = fromEvent(document, 'click');
    const scrollEvent = fromEvent(element, 'scroll');
    this.pluralEvent = merge(clickEvent, scrollEvent).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.cancelListenPluralEvent();
    });

  }

  /**
   * 取消訂閱全域點擊事件
   * @author kidin-20201104
   */
  cancelListenPluralEvent() {
    if (this.pluralEvent) this.pluralEvent.unsubscribe();
  }


  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
