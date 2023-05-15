import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, fromEvent, Subscription, merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';
import { FeatureTipsType } from '../../core/models/compo';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-feature-noun-tips',
  templateUrl: './feature-noun-tips.component.html',
  styleUrls: ['./feature-noun-tips.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule, MatIconModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureNounTipsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() tipsType: FeatureTipsType;

  private ngUnsubscribe = new Subject();
  private pluralEvent = new Subscription();

  showTargetHint = false;

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(): void {}

  /**
   * 開關提示
   * @param e {MouseEvent}
   */
  toggleTargetHint(e: MouseEvent) {
    e.stopPropagation();
    if (this.showTargetHint) {
      this.closeTargetHint();
    } else {
      this.openTargetHint();
    }
  }

  /**
   * 顯示提示
   */
  openTargetHint() {
    this.showTargetHint = true;
    this.listenPluralEvent();
  }

  /**
   * 隱藏提示
   */
  closeTargetHint() {
    this.showTargetHint = false;
    this.cancelListenPluralEvent();
  }

  /**
   * 偵測全域點擊事件，以收納其他選單
   */
  listenPluralEvent() {
    const element = document.querySelector('.main__container') as Element;
    const clickEvent = fromEvent(document, 'click');
    const scrollEvent = fromEvent(element, 'scroll');
    this.pluralEvent = merge(clickEvent, scrollEvent)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.cancelListenPluralEvent();
      });
  }

  /**
   * 取消訂閱全域點擊事件
   */
  cancelListenPluralEvent() {
    if (this.pluralEvent) this.pluralEvent.unsubscribe();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
