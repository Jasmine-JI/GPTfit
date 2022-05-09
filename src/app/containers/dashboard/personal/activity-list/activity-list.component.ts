import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivityService } from '../../../../shared/services/activity.service';
import { UtilsService } from '../../../../shared/services/utils.service';
import { SportType } from '../../../../shared/enum/sports';
import dayjs from 'dayjs';
import { Subject, Subscription, fromEvent, merge } from 'rxjs';
import { takeUntil, tap, debounceTime } from 'rxjs/operators';
import { ReportConditionOpt } from '../../../../shared/models/report-condition';
import { ReportService } from '../../../../shared/services/report.service';
import { Unit } from '../../../../shared/models/bs-constant';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { GlobalEventsService } from '../../../../core/services/global-events.service';


const dateFormat = 'YYYY-MM-DDTHH:mm:ss.SSSZ',
      defaultEnd = dayjs().endOf('day'),
      defaultStart = dayjs(defaultEnd).subtract(3, 'year').startOf('day');

@Component({
  selector: 'app-activity-list',
  templateUrl: './activity-list.component.html',
  styleUrls: ['./activity-list.component.scss']
})
export class ActivityListComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  private scrollEvent = new Subscription();
  private resizeEvent = new Subscription();

  /**
   * ui 會用到的flag
   */
  uiFlag = {
    progress: 100,
    isPortalMode: !location.pathname.includes('dashboard')
  }

  /**
   * 報告頁面可讓使用者篩選的條件
   */
  reportConditionOpt: ReportConditionOpt = {
    pageType: 'file',
    date: {
      startTimestamp: defaultStart.valueOf(),
      endTimestamp: defaultEnd.valueOf(),
      type: 'custom'
    },
    sportType: SportType.all,
    keyword: '',
    hideConfirmBtn: false
  }

  /**
   * api 2102 req body
   */
  listReq = {
    token: this.utils.getToken() || '',
    type: SportType.all,
    searchWords: '',
    page: 0,
    pageCounts: 12,
    filterStartTime: defaultStart.format(dateFormat),
    filterEndTime: defaultEnd.format(dateFormat)
  }

  activityList = [];
  targetUserId: number;
  totalCounts = 0;
  unit = Unit.metric;
  readonly sportCode = SportType;

  constructor(
    private activityService: ActivityService,
    private utils: UtilsService,
    private reportService: ReportService,
    private userProfileService: UserProfileService,
    private globalEventsService: GlobalEventsService
  ) { }

  ngOnInit(): void {
    this.getNeedInfo();
    this.subscribeScroll();
    this.setListWidth();
    this.subscribeScreenSize();
  }

  /**
   * 取得此頁面所需資訊
   * @author kidin-1100816
   */
  getNeedInfo() {
    this.userProfileService.getRxTargetUserInfo().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      const { userId, systemAccessRight, unit: userUnit } = res;
      this.targetUserId = systemAccessRight ? undefined : userId;
      this.unit = userUnit !== undefined ? userUnit : Unit.metric;
      this.reportService.setReportCondition(this.reportConditionOpt);
      this.getReportSelectedCondition();
    });

  }

  /**
   * 取得使用者所篩選的條件
   * @author kidin-1091029
   */
   getReportSelectedCondition() {
    this.reportService.getReportCondition().pipe(
      tap(res => {
        const { progress } = this.uiFlag;
        this.uiFlag.progress = progress === 100 ? 10 : progress;
      }),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      // 避免連續送出
      if (this.uiFlag.progress >= 10 && this.uiFlag.progress < 100) {
        const condition = res as any,
              { date: { startTimestamp, endTimestamp }, sportType, keyword } = condition;
        this.reportConditionOpt = this.utils.deepCopy(res);
        this.listReq.type = sportType;
        this.listReq.filterStartTime = dayjs(startTimestamp).format(dateFormat);
        this.listReq.filterEndTime = dayjs(endTimestamp).format(dateFormat);
        this.listReq.searchWords = keyword;
        this.getActivityList('filter');
      }

    });

  }

  /**
   * 取得運動列表
   * @author kidin-1100816
   */
  getActivityList(trigger: 'scroll' | 'filter' = 'filter') {
    if (this.targetUserId) {
      Object.assign(this.listReq, { targetUserId: this.targetUserId });
    }

    const filterTrigger = trigger === 'filter';
    if (filterTrigger) this.listReq.page = 0;
    this.uiFlag.progress = 30;
    this.activityService.fetchSportList(this.listReq).subscribe(res => {
      if (filterTrigger) this.activityList = [];
      const { apiCode, resultCode, resultMessage, totalCounts, info } = res;
      if (resultCode !== 200) {
        this.utils.handleError(resultCode, apiCode, resultMessage);
      } else {
        this.uiFlag.progress = 80;
        this.activityList = this.activityList.concat(this.handleScenery(info));
        this.totalCounts = totalCounts;
        this.uiFlag.progress = 100;
      }

    });

  }

  /**
   * 判斷是否有運動檔案代表圖，若無則根據運動類別與子類別給予代表圖片
   * @param list {Array<any>}-api 2102 回覆之運動列表
   * @author kidin-1100816
   */
  handleScenery(list: Array<any>) {
    return list.map(_list => {
      const { activityInfoLayer: { type, subtype }, fileInfo: { photo } } = _list;
      if (!photo || photo === 'None') {
        const img = this.activityService.handleSceneryImg(+type, +subtype);
        Object.assign(_list.fileInfo, { scenery: img });
      }

      return _list;
    });

  }

  /**
   * 另開視窗至指定的運動檔案詳細頁面
   * @param idx {number}-指定之清單序列
   * @author kidin-1100816
   */
  handleNavigation(idx: number) {
    const { fileInfo: { fileId } } = this.activityList[idx];
    let debugString = '';
    if (location.search.includes('debug=')) {
      debugString = '?debug=';
    }

    if (this.uiFlag.isPortalMode) {
      window.open(`/activity/${fileId}${debugString}`, '_blank', 'noopener=yes,noreferrer=yes');
    } else {
      window.open(`/dashboard/activity/${fileId}${debugString}`, '_blank', 'noopener=yes,noreferrer=yes');
    }

  }

  /**
   * 訂閱捲動事件，進行捲動載入列表
   * @author kidin-1100816
   */
  subscribeScroll() {
    const scrollEleClass = this.uiFlag.isPortalMode ? '.main' : '.main-body',
          targetEle = document.querySelectorAll(scrollEleClass)[0],
          scrollEvent = fromEvent(targetEle, 'scroll');
    this.scrollEvent = scrollEvent.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      const listLen = this.activityList.length;
      if (this.uiFlag.progress === 100 && listLen >= 12) {
        const lastEle = document.getElementById(`card__${listLen - 1}`),
              { y } = lastEle.getBoundingClientRect(),
              { offsetHeight } = (e as any).target;
        if (y < offsetHeight && listLen < this.totalCounts) {
          this.listReq.page++;
          this.getActivityList('scroll');
        }

      }

    });

  }

  /**
   * 訂閱resize事件
   * @author kidin-1110118
   */
  subscribeScreenSize() {
    const resize = fromEvent(window, 'resize');
    this.resizeEvent = merge(
      resize,
      this.globalEventsService.getRxSideBarMode()
    ).pipe(
      debounceTime(500),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      this.setListWidth();
    });

  }

  /**
   * 設置活動列表寬度，讓清單可以使用margin: 0 auto搭配float: left整體置中，卡片靠左，且空隙不會太大
   * @author kidin-1110118
   */
  setListWidth() {
    const container = document.querySelector('.cardSection') as HTMLElement;
    const windowWidth = window.innerWidth;
    const maxWidth = container.getBoundingClientRect().width - 20;  // 20為padding
    const cardWidth = windowWidth <= 767 ? 210 : 260;
    const oneRowNum = Math.floor(maxWidth / cardWidth);
    const targetElement = document.querySelector('.activity__list') as HTMLElement;
    targetElement.style.width = oneRowNum === 1 ? `${maxWidth - 10}px` : `${oneRowNum * cardWidth}px`;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
