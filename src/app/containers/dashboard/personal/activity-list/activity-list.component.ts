import { SlicePipe } from './../../../../core/pipes/slice.pipe';
import { ActivityListFilterComponent } from './../../../../shared/components/activity-list-filter/activity-list-filter.component';
import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  SimpleChanges,
  OnChanges,
  Input,
} from '@angular/core';
import dayjs from 'dayjs';
import { Subject, Subscription, fromEvent, merge } from 'rxjs';
import { takeUntil, tap, debounceTime } from 'rxjs/operators';
import { ReportConditionOpt } from '../../../../core/models/compo/report-condition.model';
import { DataUnitType, QueryString } from '../../../../core/enums/common';
import {
  GlobalEventsService,
  HashIdService,
  UserService,
  AuthService,
  Api21xxService,
  ReportService,
  ApiCommonService,
} from '../../../../core/services';
import { deepCopy, handleSceneryImg } from '../../../../core/utils';
import { SportType } from '../../../../core/enums/sports';
import { appPath } from '../../../../app-path.const';
import { TimeFormatPipe } from '../../../../core/pipes/time-format.pipe';
import { SportTimePipe } from '../../../../core/pipes/sport-time.pipe';
import { SportTypeIconPipe } from '../../../../core/pipes/sport-type-icon.pipe';
import { WeightSibsPipe } from '../../../../core/pipes/weight-sibs.pipe';
import { DistanceSibsPipe } from '../../../../core/pipes/distance-sibs.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { NgIf, NgFor } from '@angular/common';
import { ReportFilterComponent } from '../../../../shared/components/report-filter/report-filter.component';
import { LoadingBarComponent } from '../../../../components/loading-bar/loading-bar.component';
import { orderBy } from 'lodash';

const dateFormat = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
const defaultEnd = dayjs().endOf('day');
const defaultStart = dayjs(defaultEnd).subtract(3, 'year').startOf('day');

@Component({
  selector: 'app-activity-list',
  templateUrl: './activity-list.component.html',
  styleUrls: ['./activity-list.component.scss'],
  standalone: true,
  imports: [
    LoadingBarComponent,
    ReportFilterComponent,
    NgIf,
    NgFor,
    TranslateModule,
    DistanceSibsPipe,
    WeightSibsPipe,
    SportTypeIconPipe,
    SportTimePipe,
    TimeFormatPipe,
    ActivityListFilterComponent,
  ],
})
export class ActivityListComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  private ngUnsubscribe = new Subject();
  private scrollEvent = new Subscription();
  private resizeEvent = new Subscription();

  /**
   * ui 會用到的flag
   */
  uiFlag = {
    progress: 100,
    isPortalMode: !location.pathname.includes('dashboard'),
  };

  /**
   * 報告頁面可讓使用者篩選的條件
   */
  reportConditionOpt: ReportConditionOpt = {
    pageType: 'file',
    date: {
      startTimestamp: defaultStart.valueOf(),
      endTimestamp: defaultEnd.valueOf(),
      type: 'custom',
    },
    sportType: SportType.all,
    keyword: '',
    hideConfirmBtn: true,
  };

  /**
   * api 2102 req body 2116
   */
  listReq = {
    token: this.authService.token,
    filterStartTime: defaultStart.format(dateFormat),
    filterEndTime: defaultEnd.format(dateFormat),
    sortType: this.reportService.getSelectedOrderType(), // 1. 日期、2. 活動計時、3. 距離、4. 平均心率、5. 平均速度、6. 累重
    sortDirection: 1, // 1. 降冪(新到舊)  2. 升冪
    filter: {
      // 以下條件必帶一項
      type: SportType.all, // 運動類別，選填
      mapId: '', // 雲跑地圖編號，選填
      searchWords: '', // 檔案名稱關鍵字，選填
      targetDeviceType: [],
    },

    page: 0,
    pageCounts: 12,
  };

  activityList = [];
  targetUserId: number;
  totalCounts = 0;
  unit = DataUnitType.metric;
  readonly sportCode = SportType;

  constructor(
    private api21xxService: Api21xxService,
    private apiCommonService: ApiCommonService,
    private reportService: ReportService,
    private userService: UserService,
    private globalEventsService: GlobalEventsService,
    private hashIdService: HashIdService,
    private authService: AuthService
  ) {}

  orderType = this.reportService.getSelectedOrderType();

  ngOnInit(): void {
    this.getNeedInfo();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.subscribeScroll();
    }); // 使用setTimeout避免抓到先前命名相同之元素
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.orderType && !changes.orderType.firstChange) {
      // 當 orderType 改變且不是第一次改變時，呼叫 OrderActivityList()
      this.getActivityList('filter');
    }
  }

  /**
   * 取得此頁面所需資訊
   * @author kidin-1100816
   */
  getNeedInfo() {
    const [, firstPath, secondPath] = location.pathname.split('/');
    const isOtherOwner = firstPath === appPath.personal.home;
    const pageOwnerId = isOtherOwner
      ? +this.hashIdService.handleUserIdDecode(secondPath)
      : this.userService.getUser().userId;

    this.userService
      .getTargetUserInfo(pageOwnerId)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        const { userId, unit: userUnit } = res;
        this.targetUserId = isOtherOwner ? userId : undefined;
        this.unit = userUnit !== undefined ? userUnit : DataUnitType.metric;
        this.reportService.setReportCondition(this.reportConditionOpt);
        this.getReportSelectedCondition();
      });
  }

  /**
   * 取得使用者所篩選的條件
   * @author kidin-1091029
   */
  getReportSelectedCondition() {
    this.reportService
      .getReportCondition()
      .pipe(
        tap((res) => {
          const { progress } = this.uiFlag;
          this.uiFlag.progress = progress === 100 ? 10 : progress;
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((res) => {
        // 避免連續送出
        if (this.uiFlag.progress >= 10 && this.uiFlag.progress < 100) {
          const condition = res as any,
            {
              date: { startTimestamp, endTimestamp },
              sportType,
              keyword,
            } = condition;
          this.reportConditionOpt = deepCopy(res);
          this.listReq.filter.type = sportType;
          this.listReq.filterStartTime = dayjs(startTimestamp).format(dateFormat);
          this.listReq.filterEndTime = dayjs(endTimestamp).format(dateFormat);
          this.listReq.filter.searchWords = keyword;
          this.listReq.sortType = this.reportService.getSelectedOrderType();
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
    this.api21xxService.fetchGetSportListSort(this.listReq).subscribe((res) => {
      if (filterTrigger) this.activityList = [];
      const { apiCode, resultCode, resultMessage, totalCounts, info } = res;

      if (resultCode !== 200) {
        this.apiCommonService.handleError(resultCode, apiCode, resultMessage);
      } else {
        this.uiFlag.progress = 80;
        this.activityList = this.activityList.concat(this.handleScenery(info) as never);

        this.totalCounts = totalCounts;
        this.uiFlag.progress = 100;
      }
    });
  }

  OrderActivityList() {
    const orderType = this.reportService.getSelectedOrderType();
  }

  orderByAvgHr() {
    this.activityList = this.activityList.sort(
      (a, b) => b.activityInfoLayer.avgHeartRateBpm - a.activityInfoLayer.avgHeartRateBpm
    );
    console.log(this.activityList);
  }

  /**
   * 判斷是否有運動檔案代表圖，若無則根據運動類別與子類別給予代表圖片
   * @param list {Array<any>}-api 2102 回覆之運動列表
   * @author kidin-1100816
   */
  handleScenery(list: Array<any>) {
    return list.map((_list) => {
      const {
        activityInfoLayer: { type, subtype },
        fileInfo: { photo },
      } = _list;
      if (!photo || photo === 'None') {
        const img = handleSceneryImg(+type, +subtype);
        Object.assign(_list.fileInfo, { scenery: img });
      }

      return _list;
    });
  }

  /**
   * 另開視窗至指定的運動檔案詳細頁面
   * @param idx {number}-指定之清單索引
   * @author kidin-1100816
   */
  handleNavigation(idx: number) {
    const {
      fileInfo: { fileId },
    } = this.activityList[idx];
    let debugString = '';
    if (location.search.includes(`${QueryString.debug}=`)) {
      debugString = `?${QueryString.debug}=`;
    }

    const {
      dashboard: { home: dashboardHome },
      personal,
    } = appPath;
    const filePath = `/${personal.activityDetail}/${fileId}${debugString}`;
    const targetUrl = this.uiFlag.isPortalMode ? filePath : `/${dashboardHome}${filePath}`;
    window.open(targetUrl, '_blank', 'noopener=yes,noreferrer=yes');
  }

  /**
   * 訂閱捲動事件，進行捲動載入列表
   * @author kidin-1100816
   */
  subscribeScroll() {
    const targetEle = document.querySelector('.main__container') as Element;
    const scrollEvent = fromEvent(targetEle, 'scroll');
    this.scrollEvent = scrollEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe((e) => {
      const listLen = this.activityList.length;
      if (this.uiFlag.progress === 100 && listLen >= 12) {
        const lastEle = document.getElementById(`card__${listLen - 1}`) as Element;
        const { y } = lastEle.getBoundingClientRect();
        const { offsetHeight } = (e as any).target;
        if (y < offsetHeight && listLen < this.totalCounts) {
          this.listReq.page++;
          this.getActivityList('scroll');
        }
      }
    });
  }

  // /**
  //  * 訂閱resize事件
  //  * @author kidin-1110118
  //  */
  // subscribeScreenSize() {
  //   const resize = fromEvent(window, 'resize');
  //   this.resizeEvent = merge(resize, this.globalEventsService.getRxSideBarMode())
  //     .pipe(debounceTime(500), takeUntil(this.ngUnsubscribe))
  //     .subscribe((e) => {
  //       this.setListWidth();
  //     });
  // }

  // /**
  //  * 設置活動列表寬度，讓清單可以使用margin: 0 auto搭配float: left整體置中，卡片靠左，且空隙不會太大
  //  * @author kidin-1110118
  //  */
  // setListWidth() {
  //   const container = document.querySelector('.cards') as HTMLElement;
  //   const windowWidth = window.innerWidth;
  //   const maxWidth = container.getBoundingClientRect().width - 20; // 20為padding
  //   const cardWidth = windowWidth <= 375 ? 280 : 300;
  //   const oneRowNum = Math.floor(maxWidth / (cardWidth + 24));
  //   const targetElement = document.querySelector('.activity__list') as HTMLElement;
  //   targetElement.style.width =
  //     oneRowNum === 1 ? `${maxWidth}px` : `${(cardWidth + 24) * oneRowNum}px`;
  // }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
