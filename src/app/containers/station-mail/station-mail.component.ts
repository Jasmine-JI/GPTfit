import { Component, OnInit, OnDestroy } from '@angular/core';
import { fromEvent, Subject, Subscription } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { appPath } from '../../app-path.const';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-station-mail',
  templateUrl: './station-mail.component.html',
  styleUrls: ['./station-mail.component.scss'],
})
export class StationMailComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  private resizeEventSubscription = new Subscription();

  /**
   * ui 用到的flag
   */
  uiFlag = {
    isMobile: false,
  };

  currentPage: string;

  readonly appPath = appPath;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkPath();
    this.subscribeRouteChange();
    this.checkScreenWidth();
    this.subscribeResizeEvent();
  }

  /**
   * 根據url確認現在顯示頁面
   */
  checkPath() {
    const [empty, firstPath, secondPath, thirdPath, ...rest] = location.pathname.split('/');
    this.currentPage = thirdPath;
  }

  /**
   * 訂閱路徑變更事件
   */
  subscribeRouteChange() {
    this.router.events.pipe(takeUntil(this.ngUnsubscribe)).subscribe((e) => {
      if (e instanceof NavigationEnd) this.checkPath();
    });
  }

  /**
   * 確認螢幕寬度
   */
  checkScreenWidth() {
    const { innerWidth } = window;
    this.uiFlag.isMobile = innerWidth <= 767;
  }

  /**
   * 訂閱 resize event
   */
  subscribeResizeEvent() {
    const resizeEvent = fromEvent(window, 'resize');
    this.resizeEventSubscription = resizeEvent
      .pipe(debounceTime(1000), takeUntil(this.ngUnsubscribe))
      .subscribe((e) => {
        this.checkScreenWidth();
      });
  }

  /**
   * 建立新郵件
   */
  createMail() {
    const {
      stationMail: { home, newMail },
    } = appPath;
    this.router.navigateByUrl(`/dashboard/${home}/${newMail}`);
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
