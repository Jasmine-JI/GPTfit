import { Component, OnInit, OnDestroy } from '@angular/core';
import { OfficialActivityService } from '../../services/official-activity.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilsService } from '../../../../shared/services/utils.service';
import { UserService } from '../../../../core/services/user.service';
import { formTest } from '../../../../shared/models/form-test';
import { Subject, Subscription, fromEvent, of } from 'rxjs';
import { takeUntil, switchMap, map, tap } from 'rxjs/operators';
import { pageNotFoundPath } from '../../models/official-activity-const';
import { EventStatus, ApplyStatus } from '../../models/activity-content';
import { AccessRight } from '../../../../shared/enum/accessright';
import { NodejsApiService } from '../../../../core/services/nodejs-api.service';
import { AuthService } from '../../../../core/services/auth.service';


const switchButtonWidth = 40;
enum ApplyButtonStatus {
  canApply = 1,
  applied,
  applyFull,
  cutOff,
  eventCancelled,
  applyCancelled,
  applyCancelling
};

@Component({
  selector: 'app-activity-detail',
  templateUrl: './activity-detail.component.html',
  styleUrls: ['./activity-detail.component.scss']
})
export class ActivityDetailComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  private resizeSubscription = new Subscription;

  /**
   * ui會用到的flag
   */
  uiFlag = {
    progress: 100,
    isAdmin: false,
    applyButtonStatus: ApplyButtonStatus.canApply,
    raceEnd: false,
    isMobile: false,
    showSwitchButton: false,
    currentShortcutIndex: 0,
    canBrowserPage: false
  }

  eventId: number;
  eventInfo: any;
  eventDetail: any;
  countdownInterval: any;
  currentTimestamp: number;
  raceEndCountdwon = {
    day: '0',
    hour: '0',
    minute: '0',
    second: '0'
  };

  readonly EventStatus = EventStatus;
  readonly ApplyButtonStatus = ApplyButtonStatus;

  constructor(
    private officialActivityService: OfficialActivityService,
    private activatedRoute: ActivatedRoute,
    private utils: UtilsService,
    private router: Router,
    private userService: UserService,
    private nodejsApiService: NodejsApiService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.checkEventId();
    this.getActivityDetail();
    this.handlePageResize();
  }

  /**
   * 確認eventId是否符合數字格式
   * @author kidin-1101015
   */
  checkEventId() {
    const eventId = this.activatedRoute.snapshot.paramMap.get('eventId');
    if (formTest.number.test(eventId)) {
      this.eventId = +eventId;
    } else {
      this.router.navigateByUrl(pageNotFoundPath);
    }

  }

  /**
   * 如為登入狀態，則取得個人權限
   * @author kidin-1101015
   */
  getAccessRight() {
    return this.userService.getUser().rxUserProfile.pipe(
      switchMap(userProfile => {
        if (userProfile) {
          const token = this.authService.token;
          const { eventId } = this;
          return this.checkApplied(token, eventId).pipe(
            map(applyResult => [userProfile, applyResult])
          )
        } else {
          return of([userProfile]);
        }

      }),
      tap(res => {
        const [userProfile, checkApplied] = res;
        if (userProfile) {
          const { systemAccessright } = this.userService.getUser();
          const { applyStatus } = checkApplied.result[0] || { applyStatus: ApplyStatus.notYet };
          const passAccessRight = [AccessRight.auditor, AccessRight.pusher];
          this.uiFlag.isAdmin = passAccessRight.includes(systemAccessright);
          this.uiFlag.canBrowserPage = systemAccessright <= AccessRight.marketing;
          this.handleApplyStatus(applyStatus);
        } else {
          this.uiFlag.applyButtonStatus = ApplyButtonStatus.canApply;
          this.uiFlag.isAdmin = false;
          this.uiFlag.canBrowserPage = false;
          if (this.eventInfo) this.checkApplyDate(this.currentTimestamp);
        }
      }),
      takeUntil(this.ngUnsubscribe)
    )

  }

  /**
   * 根據報名狀態變更按鈕狀態
   * @param status {ApplyStatus}-使用者報名狀態
   * @author kidin-1110106
   */
  handleApplyStatus(status: ApplyStatus) {
    switch (status) {
      case ApplyStatus.applied:
        this.uiFlag.applyButtonStatus = ApplyButtonStatus.applied;
        break;
      case ApplyStatus.cancel:
        this.uiFlag.applyButtonStatus = ApplyButtonStatus.applyCancelled;
        break;
      case ApplyStatus.applyingQuit:
        this.uiFlag.applyButtonStatus = ApplyButtonStatus.applyCancelling;
        break;
    }

  }

  /**
   * 取得活動詳細資訊
   * @author kidin-1101014
   */
  getActivityDetail() {
    this.uiFlag.progress = 30;
    this.eventId = +this.activatedRoute.snapshot.paramMap.get('eventId');
    const body = { eventId: this.eventId };
    this.officialActivityService.getEventDetail(body).pipe(
      switchMap(res => {
        const token = this.authService.token;
        if (token) {
          return this.getAccessRight().pipe(map(accessRight => res));
        }

        return of(res);
      })
    ).subscribe(res => {
      if (this.utils.checkRes(res, false)) {
        const { eventInfo, eventDetail, currentTimestamp } = res;
        this.checkEventStatus(eventInfo.eventStatus);
        this.eventInfo = eventInfo;
        this.eventDetail = eventDetail;
        if (!this.countdownInterval) this.currentTimestamp = currentTimestamp;
        this.checkCanApply();
      } else {
        this.router.navigateByUrl(pageNotFoundPath);
      }

      this.uiFlag.progress = 100;
    });

  }

  /**
   * 確認活動狀態是否為已審核，若非已審核，且非有權限之管理員，則轉跳404頁面
   * @author kidin-1110210
   */
  checkEventStatus(eventStatus: EventStatus) {
    const { canBrowserPage } = this.uiFlag;
    if (eventStatus === EventStatus.audit || canBrowserPage) {
      return true;
    }

    this.router.navigateByUrl(pageNotFoundPath);
  }

  /**
   * 設定倒數計時器，同時確認報名與競賽日期
   * @author kidin-1101018
   */
  setCountdown() {
    if (!this.countdownInterval) {
      this.countdownInterval = setInterval(() => {
        const { raceEnd, applyButtonStatus } = this.uiFlag;
        const { eventStatus } = this.eventInfo;
        const eventCancel = eventStatus === EventStatus.cancel;
        if (!raceEnd && !eventCancel) {
          this.currentTimestamp++;
          this.checkRaceDate(this.currentTimestamp);
          if (applyButtonStatus === ApplyButtonStatus.canApply) {
            this.checkApplyDate(this.currentTimestamp);
          }

        } else {

          if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = undefined;
          }

        }

      }, 1000);

    }

  }

  /**
   * 確認是否可報名
   * @author kidin-1101018
   */
  checkCanApply() {
    const {
      eventInfo: {
        numberLimit,
        currentApplyNumber,
        eventStatus
      },
      uiFlag: { applyButtonStatus }
    } = this;

    const eventCancelled = eventStatus === EventStatus.cancel;
    if (eventCancelled) {
      this.uiFlag.applyButtonStatus = ApplyButtonStatus.eventCancelled;
    } else {

      if (applyButtonStatus !== ApplyButtonStatus.applied) {
        const applyFull = numberLimit && numberLimit > 0 ? currentApplyNumber >= numberLimit : false;
        if (applyFull) this.uiFlag.applyButtonStatus = ApplyButtonStatus.applyFull;
      }
      
      this.setCountdown();
    }

  }

  /**
   * 確認是否在報名時間內
   * @param currentTimestamp {number}-伺服器現在時間(timestamp)
   * @author kidin-1101018
   */
  checkApplyDate(currentTimestamp: number) {
    const { applyDate: {startDate, endDate}} = this.eventInfo;
    const beforeApplyStart = currentTimestamp < startDate;
    const afterApplyEnd = currentTimestamp > endDate;
    const notAtApplyDate = beforeApplyStart || afterApplyEnd;
    if (notAtApplyDate) {
      this.uiFlag.applyButtonStatus = ApplyButtonStatus.cutOff;
    }

  }


  /**
   * 確認使用者是否已經報名
   * @param token {string}-登入權杖
   * @param eventId {number}-活動流水id
   * @author kidin-1101119
   */
  checkApplied(token: string, eventId: number) {
    const body = {
      token,
      search: {
        userApplyInfo: {
          args: { eventId },
          target: ['eventId', 'applyStatus']
        }
      }
    };

    return this.nodejsApiService.getAssignInfo(body);
  }

  /**
   * 確認競賽時間是否結束
   * @param currentTimestamp {number}-伺服器現在時間(timestamp)
   * @author kidin-1101018
   */
  checkRaceDate(currentTimestamp: number) {
    const { endDate } = this.eventInfo.raceDate;
    const afterRaceEnd = currentTimestamp > endDate;
    this.uiFlag.raceEnd = afterRaceEnd;
    if (!afterRaceEnd) {
      this.getRaceCountdown(currentTimestamp, endDate);
    }

  }

  /**
   * 取得競賽結束倒數計時
   * @param currentTimestamp {number}-伺服器現在時間(timestamp)
   * @param endTimestamp {number}-賽事結束時間(timestamp)
   * @author kidin-1101018
   */
  getRaceCountdown(currentTimestamp: number, endTimestamp: number) {
    const diffTimestamp = endTimestamp - currentTimestamp;
    const numberTranslate = (value: number, coefficient: Array<number>) => {
      const result = [];
      coefficient.reduce((previousValue, _coefficient) => {
        const quotient = Math.floor(previousValue / _coefficient);
        const remainder = previousValue - quotient * _coefficient;
        result.push(quotient);
        return remainder;
      }, value);
      
      return result;
    };

    const oneSecond = 1;
    const oneMinute = 60 * oneSecond;
    const oneHour = 60 * oneMinute;
    const oneDay = 24 * oneHour;
    const [day, hour, minute, second] = numberTranslate(diffTimestamp, [oneDay, oneHour, oneMinute, oneSecond]);
    this.raceEndCountdwon = {
      day: `${day}`.padStart(2, '0'),
      hour: `${hour}`.padStart(2, '0'),
      minute: `${minute}`.padStart(2, '0'), 
      second: `${second}`.padStart(2, '0')
    };

  }

  /**
   * 捲動頁面位置至指定區塊
   * @param e {MouseEvent}
   * @param id {number}-
   * @author kidin-1101019
   */
  handleScrollTarget(e: MouseEvent, id: number) {
    e.preventDefault();
    const scrollElement = document.querySelector('.main__page');
    const targetId = `content__${id}`;
    const targetElementTop = document.getElementById(targetId).offsetTop;
    const navHeight = 60;
    scrollElement.scrollTo({
      top: targetElementTop - navHeight,
      behavior: 'smooth'
    });

  }

  /**
   * 處理視窗大小改變事件
   * @author kidin1101019
   */
  handlePageResize() {
    this.checkMobileSize(window.innerWidth);
    this.checkShortcutWidth();
    const resizeEvent = fromEvent(window, 'resize');
    this.resizeSubscription = resizeEvent.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      this.checkMobileSize(window.innerWidth);
      this.checkShortcutWidth();
    });

  }

  /**
   * 確認螢幕/視窗大小是否為攜帶裝置之大小
   * @param width {number}-螢幕/視窗大小
   * @author kidin-1101019
   */
  checkMobileSize(width: number) {
    this.uiFlag.isMobile = window.innerWidth <= 767;
  }

  /**
   * 確認捷徑清單寬度是否超出頁面，以顯示切換按鈕
   * @author kidin-1101019
   */
  checkShortcutWidth() {
    setTimeout(() => {
      const shortcutElementList = Array.from(document.querySelectorAll('#shortcut__list li'));
      if (!shortcutElementList || shortcutElementList.length === 0) {
        this.checkShortcutWidth();
      } else {
        const totalWidth = shortcutElementList.reduce((previewWidth, currentElement) => {
          const currentWidth = currentElement.getBoundingClientRect().width;
          return previewWidth + currentWidth;
        }, 0);

        const shfitElement = document.getElementById('shortcut__list');
        const navElement = document.getElementById('shortcut__section');
        const contentWidth = navElement.getBoundingClientRect().width;
        if (totalWidth > contentWidth) {
          this.uiFlag.showSwitchButton = true;
          shfitElement.style.left = `${switchButtonWidth}px`;
        } else {
          this.uiFlag.showSwitchButton = false;
          shfitElement.style.left = '0px';
        }

      }

    }, 100);

  }

  /**
   * 向前切換
   * @author kidin-1101019
   */
  switchPreview() {
    const { currentShortcutIndex } = this.uiFlag;
    if (currentShortcutIndex > 0) {
      this.uiFlag.currentShortcutIndex--;
      this.switchShortcut();

    }
    
  }

  /**
   * 向後切換
   * @author kidin-1101019
   */
  switchNext() {
    const { currentShortcutIndex } = this.uiFlag;
    const shortcutElementList = Array.from(document.querySelectorAll('#shortcut__list li'));
    if (currentShortcutIndex < shortcutElementList.length - 1) {
      this.uiFlag.currentShortcutIndex++;
      this.switchShortcut();
    }

  }

  /**
   * 切換tab
   * @author kidin-1101019
   */
  switchShortcut() {
    const { currentShortcutIndex } = this.uiFlag;
    const shortcutElementList = Array.from(document.querySelectorAll('#shortcut__list li'));
    const shiftLength = shortcutElementList.reduce((previewValue, currentElement, currentIndex) => {
      if (currentIndex >= currentShortcutIndex) {
        return previewValue;
      } else {
        const currentElementWidth = currentElement.getBoundingClientRect().width;
        return previewValue + currentElementWidth;
      }
      
    }, 0);

    const shfitElement = document.getElementById('shortcut__list');
    shfitElement.style.left = `${-shiftLength + switchButtonWidth}px`;
  }

  /**
   * 轉導至報名頁面
   * @author kidin-1101116
   */
  navigateApplyPage() {
    const { applyButtonStatus } = this.uiFlag;
    if (applyButtonStatus === ApplyButtonStatus.canApply) {
      const { eventId } = this.eventInfo;
      this.router.navigateByUrl(`/official-activity/apply-activity/${eventId}`);
    }
    
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
