import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { GroupService } from '../../../../../shared/services/group.service';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { ReportService } from '../../../../../shared/services/report.service';
import { ReportCondition } from '../../../../../shared/models/report-condition';
import { Subject, of, combineLatest, fromEvent, Subscription, merge } from 'rxjs';
import { takeUntil, switchMap, map, tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { HashIdService } from '../../../../../shared/services/hash-id.service';
import { MatSort, Sort } from '@angular/material/sort';
import dayjs from 'dayjs';
import { MatTableDataSource } from '@angular/material/table';
import SimpleLinearRegression from 'ml-regression-simple-linear';
import { SportType } from '../../../../../shared/enum/sports';
import {
  commonData,
  runData,
  rideData,
  weightTrainData,
  swimData,
  rowData,
  ballData,
  Regression
} from '../../../../../shared/models/sports-report';
import { Unit, mi } from '../../../../../shared/models/bs-constant';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';
import {
  costTimeColor,
  FilletTrendChart,
  CompareLineTrendChart,
  strokeNumColor,
  caloriesColor,
  distanceColor,
  DiscolorTrendData,
  RelativeTrendChart
} from '../../../../../shared/models/chart-data';
import { SettingObj } from '../../../../dashboard/models/group-detail';
import { MuscleCode, MuscleGroup } from '../../../../../shared/models/weight-train';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { HrBase } from '../../../../../shared/models/user-profile-info';
import { getUrlQueryStrings } from '../../../../../shared/utils/index';
import { QueryString } from '../../../../../shared/enum/query-string';
import { DateRange } from '../../../../../shared/classes/date-range';
import { BrandType, GroupLevel } from '../../../../../shared/enum/professional';
import { UserService } from '../../../../../core/services/user.service';
import { DateUnit } from '../../../../../shared/enum/report';
import { ReportDateUnit } from '../../../../../shared/classes/report-date-unit';
import { Api21xxService } from '../../../../../core/services/api-21xx.service';
import { SportsReport } from '../../../../../shared/classes/sports-report';
import { AllGroupMember } from '../../../../../shared/classes/all-group-member';


const ERROR_MESSAGE = 'Error! Please try again later.';

@Component({
  selector: 'app-sports-report',
  templateUrl: './sports-report.component.html',
  styleUrls: ['./sports-report.component.scss', '../group-child-page.scss']
})
export class SportsReportComponent implements OnInit, OnDestroy {

  @ViewChild('groupSortTable', {static: false})
  groupSortTable: MatSort;
  @ViewChild('personSortTable', {static: false})
  personSortTable: MatSort;

  private ngUnsubscribe = new Subject();
  pluralEvent = new Subscription();
  resizeEvent = new Subscription();

  /**
   * ui 用到的flag
   */
  uiFlag = {
    progress: 100,
    seeMore: false,
    printMode: false,
    isCompareMode: false
  };

  /**
   * 產生報告之篩選條件
   */
  reportCondition: ReportCondition = {
    moduleType: 'professional',
    pageType: 'sportsReport',
    baseTime: new DateRange(),
    compareTime: null,
    dateUnit: new ReportDateUnit(DateUnit.month),
    group: {
      brandType: BrandType.brand,
      currentLevel: GroupLevel.class,
      focusGroup: {
        id: null,
        name: null
      },
      brand: null,
      branches: null,
      classes: null
    },
    sportType: SportType.all
  }


  windowWidth = 320;  // 視窗寬度

  constructor(
    private utils: UtilsService,
    private reportService: ReportService,
    private groupService: GroupService,
    private hashIdService: HashIdService,
    private translate: TranslateService,
    private userProfileService: UserProfileService,
    private changeDetectorRef: ChangeDetectorRef,
    private userService: UserService,
    private api21xxService: Api21xxService
  ) { }

  ngOnInit(): void {
    this.checkWindowSize(window.innerWidth);
    this.subscribeWindowSize();
    this.initReportCondition();
  }

  /**
   * 訂閱視窗寬度
   * @author kidin-1100316
   */
   subscribeWindowSize() {
    const resize = fromEvent(window, 'resize');
    this.resizeEvent = resize.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      this.windowWidth = (e as any).target.innerWidth;
      this.checkWindowSize(this.windowWidth);
    });

  }

  /**
   * 根據視窗寬度調整分析列表最大與最小可顯示數量
   * @param width {number}-視窗寬度
   * @author kidin-1100519
   */
  checkWindowSize(width: number) {

  }

  /**
   * 將條件篩選器進行初始化
   * @author kidin-1110315
   */
  initReportCondition() {
    of([]).pipe(
      tap(() => this.getAllGroupLayer()),
      tap(() => this.checkQueryString())
    ).subscribe();

  }

  /**
   * 取得群組資訊
   * @author kidin-1110315
   */
  getGroupInfo() {
    return this.groupService.getCurrentGroupInfo();
  }

  /**
   * 取得所有群組階層
   * @author kidin-1110315
   */
  getAllGroupLayer() {
    const {
      groupDetail: { groupName, groupId, brandType },
      groupLevel,
      immediateGroupList: { brands, branches, coaches }
    } = this.getGroupInfo();

    this.reportCondition.group = {
      ...this.reportCondition.group,
      brandType,
      currentLevel: groupLevel,
      focusGroup: {
        id: groupId,
        name: groupName
      },
      classes: coaches
    }

    if (groupLevel <= GroupLevel.branch) this.reportCondition.group.branches = branches;
    if (groupLevel <= GroupLevel.brand) this.reportCondition.group.brand = brands;
  }

  /**
   * 確認query string
   * @author kidin-1110315
   */
  checkQueryString() {
console.log('check query');
    const query = getUrlQueryStrings(location.search);
    for (let _key in query) {
      const value = query[_key];
      switch (_key) {
        case QueryString.target:
          this.reportCondition.group.focusGroup.id = this.hashIdService.handleGroupIdDecode(value);
          break;
        case QueryString.baseStartTime:
          this.reportCondition.baseTime.startTimestamp = +value;
          break;
        case QueryString.baseEndTime:
          this.reportCondition.baseTime.endTimestamp = +value;
          break;
        case QueryString.compareStartTime:
          if (!this.reportCondition.compareTime) this.reportCondition.compareTime = new DateRange();
          this.reportCondition.compareTime.startTimestamp = +value;
          break;
        case QueryString.compareEndTime:
          if (!this.reportCondition.compareTime) this.reportCondition.compareTime = new DateRange();
          this.reportCondition.compareTime.endTimestamp = +value;
          break;
        case QueryString.dateRangeUnit:
          this.reportCondition.dateUnit = value;
          break;
        case QueryString.sportType:
          this.reportCondition.sportType = +value;
          break;
        case QueryString.seeMore:
          this.uiFlag.seeMore = false;
          break;
        case QueryString.printMode:
          this.uiFlag.printMode = false;
          break;
      }

    }

  }

  /**
   * 取得報告篩選條件，並產生報告
   * @param condition {ReportCondition}-報告篩選條件
   * @author kidin-1110317
   */
  getReportCondition(condition: ReportCondition) {
    if (this.uiFlag.progress === 100) {
      this.uiFlag.progress = 30;
console.log('condition', condition);
      const { group: { focusGroup: { id } }, baseTime, compareTime, dateUnit } = condition;
      this.groupService.getAllGroupMemberList(id).pipe(
        switchMap(res => {
          this.uiFlag.progress = 60;
          // 取不到所有成員資訊回空陣列
          if (!res.belongGroupId) return of([]);

          const targetUserId = res.getNoRepeatMemberId(id);
          const { utcStartTime, utcEndTime } = baseTime;
          const baseBody = {
            token: this.userService.getToken(),
            targetUserId,
            filterStartTime: utcStartTime,
            filterEndTime: utcEndTime,
            type: dateUnit.reportDateType
          };

          const request = [this.api21xxService.fetchSportSummaryArray(baseBody)];

          // 確認是否需要進行數據比較
          if (!compareTime) {
            this.uiFlag.isCompareMode = false;
          } else {
            this.uiFlag.isCompareMode = true;
            const { utcStartTime: compareUtcStartTime, utcEndTime: compareUtcEndTime } = compareTime;
            const compareBody = { ...baseBody, filterStartTime: compareUtcStartTime, filterEndTime: compareUtcEndTime };
            request.push(this.api21xxService.fetchSportSummaryArray(compareBody));
          }

          return combineLatest(request).pipe(
            map(responseArray => [res, ...responseArray])
          );

        })

      ).subscribe(resultArray => {
        // 陣列為空則顯示錯誤訊息
        if (resultArray.length === 0) return this.utils.openAlert(ERROR_MESSAGE);

        const [allGroupMemberList, baseSportSummary, compareSportSummary] = resultArray;
console.log('baseSportSummary', baseSportSummary);
console.log('compareSportSummary', compareSportSummary);
        this.handleBasePersonalData(dateUnit, allGroupMemberList, baseSportSummary);
        this.handleBaseGroupData();
        if (this.uiFlag.isCompareMode) {
          this.handleComparePersonalData(dateUnit, allGroupMemberList, compareSportSummary);
          this.handleCompareGroupData();
        }

        this.uiFlag.progress = 100;
      });

    }

  }

  /**
   * 處理每個成員個人基準數據
   * @param dataArray {Array<any>}-多人的運動數據陣列
   * @author kidin-1110318
   */
  handleBasePersonalData(dateUnit: ReportDateUnit, allGroupList: AllGroupMember, dataArray: Array<any>) {
    const { sportTarget } = this.getGroupInfo();
    dataArray.forEach(_data => {
      const { userId: _userId } = _data;
      const _dataArray = _data[dateUnit.getReportKey('sportsReport')];
      const unit = dateUnit.unit;
      const _sportData = new SportsReport(sportTarget, unit, _dataArray);
      
      allGroupList.savePersonalData(_userId, 'baseSport', _sportData);
    });

  }


  handleBaseGroupData() {}
  handleComparePersonalData(dateUnit: ReportDateUnit, allGroupList: AllGroupMember, dataArray: Array<any>) {}
  handleCompareGroupData() {}

  /**
   * 解除rxjs訂閱
   * @author kidin-1091211
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}