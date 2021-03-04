import { Component, OnInit, OnChanges, OnDestroy, Input } from '@angular/core';
import {  Subscription, Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UtilsService } from '../../services/utils.service';

@Component({
  selector: 'app-loading-bar',
  templateUrl: './loading-bar.component.html',
  styleUrls: ['./loading-bar.component.scss']
})
export class LoadingBarComponent implements OnInit, OnChanges, OnDestroy {

  private ngUnsubscribe = new Subject();

  @Input('progress') progress: number;
  @Input('isPreviewMode') isPreviewMode: boolean = false;

  /**
   * UI用到的各個flag
   */
  uiFlag = {
    pageComplete: true
  }

  constructor(
    private utils: UtilsService
  ) { }

  ngOnInit(): void {
    this.utils.getLoadingProgress().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.progress = res;
      this.changeProgress();
    });

  }

  ngOnChanges(): void {
    this.changeProgress();
  }

  /**
   * 變更進度
   * @author kidin-1100302
   */
  changeProgress() {
    if (this.progress !== 100) {
      this.uiFlag.pageComplete = false;
    } else if (this.progress === 100) {
      setTimeout(() => {
        this.uiFlag.pageComplete = true;
      }, 1000);

    }

  }

  /**
   * 移除訂閱
   * @author kidin-1100302
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}