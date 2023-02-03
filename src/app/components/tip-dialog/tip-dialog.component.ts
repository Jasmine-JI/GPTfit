import {
  Component,
  Input,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, Subscription, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DataDescription } from '../../core/models/compo';

@Component({
  selector: 'app-tip-dialog',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './tip-dialog.component.html',
  styleUrls: ['./tip-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TipDialogComponent implements OnDestroy {
  private ngUnsubscribe = new Subject();
  private clickEventSubscription = new Subscription();

  @Input() description: Array<DataDescription>;

  showDialog = false;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  /**
   * 開關說明提示框
   * @param e {MouseEvent}
   */
  toggleDialog(e: MouseEvent) {
    e.stopPropagation();
    this.showDialog ? this.closeDialog() : this.openDialog();
  }

  /**
   * 顯示說明彈跳框
   */
  openDialog() {
    this.showDialog = true;
    this.subscribeClickEvent();
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 訂閱全域點擊事件，讓使用者點擊外圍時關閉說明框
   */
  subscribeClickEvent() {
    const targetElement = document.querySelector('.main__container');
    this.clickEventSubscription = fromEvent(targetElement, 'click')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.closeDialog();
      });
  }

  /**
   * 關閉說明彈跳框
   */
  closeDialog() {
    this.showDialog = false;
    this.unSubscribeClickEvent();
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 取消訂閱全域點擊事件
   */
  unSubscribeClickEvent() {
    if (this.clickEventSubscription) this.clickEventSubscription.unsubscribe();
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
