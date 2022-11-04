import { Component, OnInit, OnDestroy } from '@angular/core';
import { OfficialActivityService } from '../../services/official-activity.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilsService } from '../../../../shared/services/utils.service';
import { UserService, AuthService, NodejsApiService } from '../../../../core/services';
import { formTest } from '../../../../shared/models/form-test';
import { Subject, Subscription, fromEvent, of } from 'rxjs';
import { takeUntil, switchMap, map, tap } from 'rxjs/operators';
import { pageNotFoundPath } from '../../models/official-activity-const';
import { EventStatus, ApplyStatus, EventInfo, EventDetail } from '../../models/activity-content';
import { AccessRight } from '../../../../shared/enum/accessright';
import { Gender } from '../../../../core/enums/personal';
import { UserProfileInfo } from '../../../../shared/models/user-profile-info';
import { QueryString } from '../../../../shared/enum/query-string';

const switchButtonWidth = 40;
const navHeight = 60;
enum ApplyButtonStatus {
  canApply = 1,
  applied,
  applyFull,
  cutOff,
  eventCancelled,
  applyCancelled,
  applyCancelling,
}

@Component({
  selector: 'app-activity-detail',
  templateUrl: './activity-detail.component.html',
  styleUrls: ['./activity-detail.component.scss'],
})
export class ActivityDetailComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  private resizeSubscription = new Subscription();

  /**
   * ui會用到的flag
   */
  uiFlag = {
    progress: 100,
    isAdmin: false,
    applyButtonStatus: ApplyButtonStatus.canApply,
    groupApply: true,
    raceEnd: false,
    isMobile: false,
    showSwitchButton: false,
    currentShortcutIndex: 0,
  };

  /**
   * 如有登入則確認是否符合各分組報名資格
   */
  groupApplyCheck: Array<{ isFull: boolean; qualified: boolean }> = [];

  /**
   * 欲報名的分組
   */
  currentSelectedGroup: number | null = null;

  eventId: number;
  eventInfo: EventInfo;
  eventDetail: EventDetail;
  countdownInterval: any;
  currentTimestamp: number;
  raceEndCountdwon = {
    day: '0',
    hour: '0',
    minute: '0',
    second: '0',
  };

  readonly EventStatus = EventStatus;
  readonly ApplyButtonStatus = ApplyButtonStatus;
  readonly Gender = Gender;

  constructor(
    private officialActivityService: OfficialActivityService,
    private activatedRoute: ActivatedRoute,
    private utils: UtilsService,
    private router: Router,
    private userService: UserService,
    private nodejsApiService: NodejsApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    of('')
      .pipe(
        map(() => this.getEventId()),
        switchMap((eventId) => this.getEventInfomation(eventId)),
        switchMap((eventInfomation) =>
          this.getUserProfile().pipe(
            map((userProfile) => [eventInfomation, userProfile] as [any, UserProfileInfo])
          )
        ),
        tap((res) => this.checkPagePermission(res)),
        switchMap((res) => this.checkApplyStatus().pipe(map(() => res))),
        tap((res) => this.checkApplyQualifications(res)),
        tap((res) => this.getSelectedGroup(res)),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(([eventInfomation]) => {
        const { eventInfo, eventDetail, currentTimestamp } = eventInfomation;
        this.eventInfo = eventInfo;
        this.eventDetail = eventDetail;
        if (!this.countdownInterval) this.currentTimestamp = currentTimestamp;
        this.setCountdown();
        this.handlePageResize();
        this.uiFlag.progress = 100;
      });
  }

  /**
   * 確認eventId是否符合數字格式
   */
  getEventId() {
    const eventId = this.activatedRoute.snapshot.paramMap.get('eventId');
    if (formTest.number.test(eventId)) {
      this.eventId = +eventId;
    } else {
      this.router.navigateByUrl(pageNotFoundPath, { replaceUrl: true });
    }

    return this.eventId;
  }

  /**
   * 取得活動詳細資訊
   * @param eventId {number}-活動編號
   */
  getEventInfomation(eventId: number) {
    this.uiFlag.progress = 30;
    return this.officialActivityService.getEventDetail({ eventId }).pipe(
      map((res) => {
        if (this.utils.checkRes(res, false)) return res;
        this.router.navigateByUrl(pageNotFoundPath, { replaceUrl: true });
        return false;
      })
    );
  }

  /**
   * 取得個人資訊
   */
  getUserProfile() {
    return this.userService.getUser().rxUserProfile;
  }

  /**
   * 確認頁面是否為可瀏覽狀態
   * @param pageData {[any, UserProfileInfo]}-[api 6002 response, 使用者資訊]
   */
  checkPagePermission(pageData: [any, UserProfileInfo]) {
    const [eventInfomation] = pageData;
    const { eventStatus } = eventInfomation.eventInfo;
    const { systemAccessright } = this.userService.getUser();
    const passAccessRight = [AccessRight.auditor, AccessRight.pusher]; // 可編輯活動的權限
    const permit = systemAccessright <= AccessRight.marketing;
    const eventCancel = eventStatus === EventStatus.cancel;
    const eventAudit = eventStatus === EventStatus.audit;
    this.uiFlag.isAdmin = passAccessRight.includes(systemAccessright);
    if (eventAudit || eventCancel || permit) {
      if (eventCancel)
        this.uiFlag.applyButtonStatus = this.handleApplyButtonStatus(
          ApplyButtonStatus.eventCancelled
        );
      return pageData;
    }

    // 不符資格就跳404頁面
    this.router.navigateByUrl(pageNotFoundPath, { replaceUrl: true });
    return pageData;
  }

  /**
   * 確認報名狀態
   */
  checkApplyStatus() {
    const token = this.authService.token;
    if (token) {
      const { eventId } = this;
      return this.checkApplied(token, eventId).pipe(
        tap((res) => {
          const { applyStatus } = res.result[0] || { applyStatus: ApplyStatus.notYet };
          const nextStatus = this.handleApplyStatus(applyStatus);
          this.uiFlag.applyButtonStatus = this.handleApplyButtonStatus(nextStatus);
        })
      );
    }

    this.uiFlag.applyButtonStatus = this.handleApplyButtonStatus(ApplyButtonStatus.canApply);
    return of('');
  }

  /**
   * 根據報名狀態變更按鈕狀態
   * @param status {ApplyStatus}-使用者報名狀態
   */
  handleApplyStatus(status: ApplyStatus) {
    switch (status) {
      case ApplyStatus.applied:
        return ApplyButtonStatus.applied;
      case ApplyStatus.cancel:
        return ApplyButtonStatus.applyCancelled;
      case ApplyStatus.applyingQuit:
        return ApplyButtonStatus.applyCancelling;
      default:
        return ApplyButtonStatus.canApply;
    }
  }

  /**
   * 處理報名按鈕狀態，依照狀態優先順序確認是否調整狀態
   * @param next {ApplyButtonStatus}
   */
  handleApplyButtonStatus(next: ApplyButtonStatus) {
    const { applyButtonStatus } = this.uiFlag;
    const token = this.authService.token;
    switch (applyButtonStatus) {
      case ApplyButtonStatus.eventCancelled:
        return applyButtonStatus;
      case ApplyButtonStatus.applied:
      case ApplyButtonStatus.applyCancelled:
      case ApplyButtonStatus.applyCancelling:
        switch (next) {
          case ApplyButtonStatus.canApply:
          case ApplyButtonStatus.applyFull:
          case ApplyButtonStatus.cutOff:
            // 若已登入，則已使用者報名狀態為主
            if (token) return applyButtonStatus;
            return next;
          default:
            return next;
        }
      default:
        return next;
    }
  }

  /**
   * 確認各分組報名資格
   * @param pageData {[any, UserProfileInfo]}-[api 6002 response, 使用者資訊]
   */
  checkApplyQualifications(pageData: [any, UserProfileInfo]) {
    const [eventInfomation, userProfile] = pageData;
    const {
      eventInfo: { numberLimit },
      eventDetail: { group },
    } = eventInfomation;
    const token = this.authService.token;
    const { age } = this.userService.getUser();
    const { gender } = userProfile;
    this.groupApplyCheck = group.map((_group) => {
      const { gender: _gender, age: _age, currentApplyNumber } = _group;
      const isFull = numberLimit > 0 && currentApplyNumber >= numberLimit;
      const sameGender = _gender === Gender.unlimit || _gender === gender;
      const inAgeRange = !_age || (age >= _age.min && age <= _age.max);
      return {
        isFull,
        qualified: !token || (sameGender && inAgeRange),
      };
    });

    return pageData;
  }

  /**
   * 確認各分組報名資格
   * @param pageData {[any, UserProfileInfo]}-[api 6002 response, 使用者資訊]
   */
  getSelectedGroup(pageData: [any, UserProfileInfo]) {
    const {
      uiFlag: { applyButtonStatus },
      groupApplyCheck,
    } = this;
    if (applyButtonStatus === ApplyButtonStatus.canApply) {
      const index = groupApplyCheck.findIndex((_group) => !_group.isFull && _group.qualified);
      if (index > -1) this.currentSelectedGroup = index;
    }

    return pageData;
  }

  /**
   * 設定倒數計時器，同時確認報名與競賽日期
   */
  setCountdown() {
    if (!this.countdownInterval) {
      this.countdownInterval = setInterval(() => {
        const { raceEnd } = this.uiFlag;
        const { eventStatus } = this.eventInfo;
        const eventCancel = eventStatus === EventStatus.cancel;
        if (!raceEnd && !eventCancel) {
          this.currentTimestamp++;
          this.checkRaceDate(this.currentTimestamp);
          this.checkApplyDate(this.currentTimestamp);
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
   * 確認是否在報名時間內
   * @param currentTimestamp {number}-伺服器現在時間(timestamp)
   * @author kidin-1101018
   */
  checkApplyDate(currentTimestamp: number) {
    const {
      applyDate: { startDate, endDate },
    } = this.eventInfo;
    const beforeApplyStart = currentTimestamp < startDate;
    const afterApplyEnd = currentTimestamp > endDate;
    const notAtApplyDate = beforeApplyStart || afterApplyEnd;
    if (notAtApplyDate) {
      this.uiFlag.applyButtonStatus = this.handleApplyButtonStatus(ApplyButtonStatus.cutOff);
      if (afterApplyEnd) {
        this.uiFlag.groupApply = false;
      }
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
          target: ['eventId', 'applyStatus'],
        },
      },
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
    const [day, hour, minute, second] = numberTranslate(diffTimestamp, [
      oneDay,
      oneHour,
      oneMinute,
      oneSecond,
    ]);
    this.raceEndCountdwon = {
      day: `${day}`.padStart(2, '0'),
      hour: `${hour}`.padStart(2, '0'),
      minute: `${minute}`.padStart(2, '0'),
      second: `${second}`.padStart(2, '0'),
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
    scrollElement.scrollTo({
      top: targetElementTop - navHeight,
      behavior: 'smooth',
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
    this.resizeSubscription = resizeEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe((e) => {
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
   * 將頁面捲動至報名區塊
   */
  navigateApplySection() {
    const targetSection = document.querySelector('.apply__section') as HTMLElement;
    const targetTop = targetSection.offsetTop;
    const scrollElement = document.querySelector('.main__page');
    scrollElement.scrollTo({
      top: targetTop - navHeight,
      behavior: 'smooth',
    });
  }

  /**
   * 選擇分組
   * @param index {number}-分組序列
   */
  selectGroup(index: number) {
    if (this.groupApplyCheck[index]) {
      this.currentSelectedGroup = index;
    }
  }

  /**
   * 轉導至報名頁面
   */
  navigateApplyPage() {
    const index = this.currentSelectedGroup;
    if (index !== null && this.groupApplyCheck[index]) {
      const { applyButtonStatus } = this.uiFlag;
      if (applyButtonStatus === ApplyButtonStatus.canApply) {
        const { eventId } = this.eventInfo;
        const url = `/official-activity/apply-activity/${eventId}?${QueryString.applyGroup}=${index}`;
        this.router.navigateByUrl(url);
      }
    }
  }

  /**
   * 轉導至活動編輯頁面
   * @param e {MouseEvent}
   */
  navigateEditPage(e: MouseEvent) {
    e.preventDefault();
    this.router.navigateByUrl(`/official-activity/edit-activity/${this.eventInfo.eventId}`);
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
