import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
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

  /**
   * 提示框按鈕
   */
  @ViewChild('hintButton') hintButton: ElementRef;

  private ngUnsubscribe = new Subject();
  private pluralEvent = new Subscription();

  showTargetHint = false;

  /**
   * 浮動提示框需要偏移的距離，避免rwd時超出視窗
   */
  translate = 'translateX(0)';

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
    this.checkHintPosition();
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

  /**
   * 確認提示框是否超出螢幕邊界
   */
  checkHintPosition() {
    const target = this.hintButton?.nativeElement;
    if (target) {
      const { right } = target.getBoundingClientRect();
      const { innerWidth } = window;
      const padding = 10;
      const hintBoxWidth = 260;
      const diff = right + hintBoxWidth - (innerWidth - padding);
      this.translate = `translateX(${diff > 0 ? -diff : 0}px)`;
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
