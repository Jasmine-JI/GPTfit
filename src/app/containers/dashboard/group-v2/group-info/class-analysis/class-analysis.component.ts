import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { GroupDetailInfo, UserSimpleInfo, MemberInfo } from '../../../models/group-detail';
import { Subject, combineLatest, of } from 'rxjs';
import { takeUntil, map, switchMap, first } from 'rxjs/operators';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import {
  HashIdService,
  AuthService,
  Api10xxService,
  Api11xxService,
  Api21xxService,
  Api70xxService,
  HintDialogService,
  UserService,
} from '../../../../../core/services';
import { ProfessionalService } from '../../../../professional/services/professional.service';
import {
  displayGroupLevel,
  getUrlQueryStrings,
  setUrlQueryString,
  countPercentage,
  getFileInfoParam,
} from '../../../../../core/utils';
import { FileFooterInfo, StationDataList } from '../../../../../core/models/compo';
import {
  SortDirection,
  ComplexSportSortType,
  IntegrationType,
  ResultCode,
} from '../../../../../core/enums/common';
import { DataIntegration } from '../../../../../core/classes';
import { Domain, WebIp } from '../../../../../shared/enum/domain';
import { SportType } from '../../../../../core/enums/sports';
import { caloriesColor, avgHrColor } from '../../../../../shared/models/chart-data';

dayjs.extend(weekday);

const errMsg = `Error.<br />Please try again later.`;

@Component({
  selector: 'app-class-analysis-v2',
  templateUrl: './class-analysis.component.html',
  styleUrls: ['./class-analysis.component.scss', '../group-child-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassAnalysisComponent implements OnInit, OnDestroy {
  @ViewChild('sortTable', { static: false })
  sortTable: MatSort;

  private ngUnsubscribe = new Subject();
  readonly showLength = 5;
  readonly caloriesColor = caloriesColor;
  readonly avgHrColor = avgHrColor;

  /**
   * UI會用到的各個flag
   */
  uiFlag = {
    isDebugMode: false,
    isPreviewMode: false,
    isLoading: false,
    noData: true,
    isRangeReport: false,
  };

  /**
   * 此群組相關資料
   */
  groupInfo = <GroupDetailInfo>{};

  /**
   * 使用者個人資訊（含權限）
   */
  userSimpleInfo: UserSimpleInfo;

  /**
   * 成員名單
   */
  memberList: Array<MemberInfo> = [];

  /**
   * 課程運動類別
   */
  classSportsType = SportType.all;

  /**
   * 用來更新url query string
   */
  reportTimeRange = {
    classTime: null,
    startTime: null,
    endTime: null,
  };

  /**
   * 報告概要資訊
   */
  summary = {
    memberCounts: 0, // 課程人員數
    classCount: 0, // 期間課程次數
    classAvgDurationTime: 0, // 平均單堂課程時間
    avgHr: 0, // 單堂單人平均心率
    totalAvgCalories: 0, // 期間平均單人卡路里消耗
    avgSpeed: 0, // 單堂單人平均速度
    totalAvgDistance: 0, // 期間單人平均距離
    avgWatt: 0, // 單堂單人平均功率
  };

  fileInfo: any;
  reportCreatedTime = dayjs().format('YYYY-MM-DD HH:mm');
  classLink: HTMLElement;
  previewUrl: any;
  memberDataMap = new Map<number, any>();
  tableData = new MatTableDataSource<any>();
  showMore = false;
  focusMember: null | number = null;
  caloriesChartData: any;
  hrZoneChartData: any;
  caloriesTrendData: any;
  hrTrendData: any;
  stationList: StationDataList;
  userUnit = this.userService.getUser().unit;
  footerInfo: FileFooterInfo;

  constructor(
    private api11xxService: Api11xxService,
    private hintDialogService: HintDialogService,
    private api21xxService: Api21xxService,
    private translate: TranslateService,
    private api10xxService: Api10xxService,
    private hashIdService: HashIdService,
    private router: Router,
    private api70xxService: Api70xxService,
    private authService: AuthService,
    private professionalService: ProfessionalService,
    private userService: UserService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initPage();
    this.tableData.sort = this.sortTable;
  }

  /**
   * 取得已儲存的群組詳細資訊、階層群組資訊、使用者資訊
   */
  initPage() {
    combineLatest([
      this.professionalService.getRxGroupDetail(),
      this.professionalService.getRxCommerceInfo(),
      this.professionalService.getUserSimpleInfo(),
    ])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((resArr) => {
        const [groupInfo, commerceInfo, userSimpleInfo] = resArr;
        this.groupInfo = groupInfo;
        Object.assign(groupInfo, { groupLevel: displayGroupLevel(groupInfo.groupId) });
        Object.assign(groupInfo, { expired: commerceInfo.expired });
        Object.assign(groupInfo, { commerceStatus: commerceInfo.commerceStatus });
        this.userSimpleInfo = userSimpleInfo;
        this.checkQueryString(location.search);
        this.getRxMemberList();
      });
  }

  /**
   * 根據url帶的不同query string進行處理
   * @param search {string}-location search
   */
  checkQueryString(search: string) {
    if (search) {
      const queryObj = getUrlQueryStrings(search);
      Object.entries(queryObj).forEach(([_key, _value]) => {
        switch (_key) {
          case 'debug':
            this.uiFlag.isDebugMode = true;
            break;
          case 'ipm':
            this.uiFlag.isPreviewMode = true;
            break;
        }
      });
    }
  }

  /**
   * 藉由rx取得已儲存之成員名單，若取不到則call api並儲存
   */
  getRxMemberList() {
    const { token } = this.authService;
    this.professionalService
      .getRXClassMemberList()
      .pipe(
        first(),
        switchMap((res) => (res.length === 0 ? this.getMemberList(token) : of(res))),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((response) => {
        if (token) this.memberList = (response as Array<any>).map((_res) => _res.memberId);
      });
  }

  /**
   * 透過 api 取得成員名單
   * @param token {string}-登入權杖
   */
  getMemberList(token: string) {
    const body = {
      token,
      groupId: this.groupInfo.groupId,
      groupLevel: displayGroupLevel(this.groupInfo.groupId),
      infoType: 3,
      avatarType: 3,
    };

    return this.api11xxService.fetchGroupMemberList(body).pipe(
      map((res) => {
        const { resultCode, apiCode, resultMessage, info } = res;
        if (resultCode !== 200) {
          console.error(`${resultCode}: Api ${apiCode} ${resultMessage}`);
          return [];
        } else {
          const list = this.sortMember(info.groupMemberInfo);
          this.professionalService.setClassMemberList(list);
          return list;
        }
      })
    );
  }

  /**
   * 將成員依加入狀態分類
   * @param memArr {Array<MemberInfo>}-api 1103回應的groupMemberInfo內容
   */
  sortMember(memArr: Array<MemberInfo>) {
    const list = [];
    memArr.forEach((_mem) => {
      if (_mem.joinStatus === 2) {
        list.push(_mem);
      }
    });

    return list;
  }

  /**
   * 根據不同使用方式取得Api 2111 Request Body
   * @param searchTimeOption {number}-要覆蓋 api 2111 searchTime 的設定
   */
  getApi2011RequestBody(searchTimeOption: any) {
    const {
      uiFlag: { isDebugMode },
      groupInfo: { groupId },
    } = this;
    return {
      token: this.authService.token,
      searchTime: {
        type: 1,
        fuzzyTime: '',
        filterStartTime: '',
        filterEndTime: '',
        filterSameTime: isDebugMode ? 1 : 2,
        ...searchTimeOption,
      },
      searchRule: {
        activity: 99,
        targetUser: isDebugMode ? 99 : 2,
        fileInfo: {
          author: '',
          dispName: '',
          equipmentSN: '',
          class: groupId,
          teacher: '',
          tag: '',
        },
      },
      display: {
        activityLapLayerDisplay: 3,
        activityLapLayerDataField: [],
        activityPointLayerDisplay: 3,
        activityPointLayerDataField: [],
      },
      page: '0',
      pageCounts: '1000',
    };
  }

  /**
   * 選擇單一堂課程
   * @param specifyTime {string}-指定的時間(UTC格式)
   */
  selectSingleClass(specifyTime: string) {
    this.uiFlag.isRangeReport = false;
    this.reportTimeRange = { classTime: specifyTime, startTime: null, endTime: null };
    const timeOption = {
      type: 3,
      filterSameTime: 1,
      specifyTime,
    };
    const body = this.getApi2011RequestBody(timeOption);
    this.sendRequest(body);
  }

  /**
   * 選擇多堂課程
   * @param timeRange { { filterStartTime: string; filterEndTime: string; } }
   */
  selectRangeDate(timeRange: { filterStartTime: string; filterEndTime: string }) {
    this.uiFlag.isRangeReport = true;
    const { filterStartTime, filterEndTime } = timeRange;
    this.reportTimeRange = { classTime: null, startTime: filterStartTime, endTime: filterEndTime };
    const timeOption = {
      type: 1,
      filterSameTime: 1,
      filterStartTime,
      filterEndTime,
    };
    const body = this.getApi2011RequestBody(timeOption);
    this.sendRangeReportRequest(body);
  }

  /**
   * 初始化報告
   */
  initReport() {
    this.uiFlag.isLoading = true;
    this.focusMember = null;
    this.footerInfo = undefined;
  }

  /**
   * 處理 api 例外狀況
   * @param res {any}-api 2111 response
   */
  handleReportError(res) {
    const { resultCode, apiCode, resultMessage } = res;
    this.uiFlag.noData = true;
    this.updateUrl(false);
    this.hintDialogService.openAlert(errMsg);
    console.error(`${resultCode}: Api ${apiCode} ${resultMessage}`);
  }

  /**
   * 取得單筆活動資料並處理
   * @param body {any}-api 2111 request body
   */
  sendRequest(body: any) {
    this.initReport();
    this.api21xxService.fetchMultiActivityData(body).subscribe((res) => {
      this.uiFlag.isLoading = false;
      const { resultCode, info, cross_multi_info } = res;
      if (resultCode !== 200) {
        this.handleReportError(res);
      } else {
        this.reportCreatedTime = dayjs().format('YYYY-MM-DD HH:mm');
        if (cross_multi_info && cross_multi_info.length > 0) {
          this.uiFlag.noData = false;
          this.handleComplexTypeData(cross_multi_info);
        } else {
          this.checkData(info.activities);
        }
      }

      this.changeDetectorRef.markForCheck();
    });
  }

  /**
   * 處理多人複合式運動檔案
   * @param crossMultiInfo {Array<any>}-api 2111 res.cross_multi_info 內容
   */
  handleComplexTypeData(crossMultiInfo: Array<any>) {
    const summaryInfo = { activities: [] };
    const stationList: StationDataList = {
      summary: [],
      station: [],
      sortType: ComplexSportSortType.nickname,
      sortDirection: SortDirection.asc,
    };
    const stationInfoMap = new Map();
    const stationDataMap = new Map();
    crossMultiInfo.forEach((_activity) => {
      const { activityInfoLayer, fileInfo, info } = _activity;
      summaryInfo.activities.push({ activityInfoLayer, fileInfo });
      const nickname = fileInfo.author.split('?')[0];
      const {
        avgHeartRateBpm,
        calories,
        totalHrZone0Second,
        totalHrZone1Second,
        totalHrZone2Second,
        totalHrZone3Second,
        totalHrZone4Second,
        totalHrZone5Second,
        totalDistanceMeters,
      } = activityInfoLayer;
      stationList.summary.push({
        nickname,
        avgHeartRateBpm,
        calories,
        totalDistanceMeters,
        hrZone: [
          totalHrZone0Second,
          totalHrZone1Second,
          totalHrZone2Second,
          totalHrZone3Second,
          totalHrZone4Second,
          totalHrZone5Second,
        ],
      });

      info.forEach((_info) => {
        const { activityInfoLayer, fileInfo } = _info;
        const { stationId } = getUrlQueryStrings(fileInfo.class);
        const {
          avgHeartRateBpm,
          calories,
          totalHrZone0Second,
          totalHrZone1Second,
          totalHrZone2Second,
          totalHrZone3Second,
          totalHrZone4Second,
          totalHrZone5Second,
          avgSpeed,
          totalDistanceMeters,
          runAvgCadence,
          cycleAvgWatt,
          cycleAvgCadence,
          rowingAvgCadence,
          rowingAvgWatt,
          type,
        } = activityInfoLayer;
        const currentStationList = stationDataMap.get(stationId) || [];
        currentStationList.push({
          nickname,
          avgHeartRateBpm,
          calories,
          hrZone: [
            totalHrZone0Second,
            totalHrZone1Second,
            totalHrZone2Second,
            totalHrZone3Second,
            totalHrZone4Second,
            totalHrZone5Second,
          ],
          avgSpeed,
          totalDistanceMeters,
          runAvgCadence,
          cycleAvgWatt,
          cycleAvgCadence,
          rowingAvgCadence,
          rowingAvgWatt,
        });
        stationDataMap.set(stationId, currentStationList);

        if (!stationInfoMap.get(stationId))
          stationInfoMap.set(stationId, { type: +type, dispName: fileInfo.dispName });
      });
    });

    stationDataMap.forEach((_value, _key) => {
      const stationInfo = stationInfoMap.get(_key);
      stationList.station.push({
        stationId: _key,
        memberList: _value,
        ...stationInfo,
      });
    });

    this.stationList = stationList;
    this.checkData(summaryInfo.activities);
  }

  /**
   * 取得變數內容並將部分變數替換成html element
   */
  getReportDescription() {
    setTimeout(() => {
      const memberCounts = this.memberDataMap.size;
      this.translate.get('hellow world').subscribe(() => {
        const targetDiv = document.getElementById('reportInfo');
        if (targetDiv) {
          targetDiv.innerHTML = this.translate.instant('universal_group_sportsRecordReportClass', {
            class: `<span id="classLink">${this.fileInfo?.dispName ?? ''}</span>`,
            dateTime: this.getClassRealDateTime(),
            number: `<span id="studentsNum">${memberCounts}</span>`,
          });

          const studentsNum = document.getElementById('studentsNum');
          studentsNum.setAttribute('class', 'fileAmount');
          this.classLink = document.getElementById('classLink');
          this.classLink.setAttribute('class', 'activity-Link');
          this.classLink.addEventListener('click', this.visitLink.bind(this));
        }
      });
    });
  }

  /**
   * 送出範圍報告 request
   * @param body {any}
   */
  sendRangeReportRequest(body: any) {
    this.initReport();
    this.api21xxService.fetchMultiActivityData(body).subscribe((res) => {
      this.uiFlag.isLoading = false;
      const { resultCode, info, cross_multi_info } = res;
      if (resultCode !== 200) {
        this.handleReportError(res);
      } else {
        const allActivities = this.mergeAllData(info.activities, cross_multi_info);
        this.checkData(allActivities);
      }

      this.changeDetectorRef.markForCheck();
    });
  }

  /**
   * 將單一類型運動數據與複合式運動數據進行合併與排序
   * @param info {Array<any>}-單一類型運動數據
   * @param complexActivities {Array<any>}-複合式類型運動數據
   */
  mergeAllData(singleActivities: Array<any>, complexActivities: Array<any>) {
    return singleActivities.concat(complexActivities ?? []).sort((_a, _b) => {
      const _aActivity = dayjs(_a.activityInfoLayer.startTime).valueOf();
      const _bActivity = dayjs(_b.activityInfoLayer.startTime).valueOf();
      return _aActivity - _bActivity;
    });
  }

  /**
   * 確認是否有任何上課數據
   * @param data {Array<any>}-課程數據
   */
  checkData(data: Array<any>) {
    const dataLength = data.length;
    if (dataLength === 0) {
      this.uiFlag.noData = true;
      this.updateUrl(false);
    } else {
      this.uiFlag.noData = false;
      this.showMore = false;
      this.extractData(data);
      const { fileInfo } = data[0]; // 暫時只顯示第一筆資料的裝置與老師
      this.fileInfo = fileInfo;
      const { equipmentSN, teacher } = fileInfo;
      this.getFooterInfo(equipmentSN, getFileInfoParam(teacher).userId);
      this.updateUrl(true);
    }
  }

  /**
   * 從數據中提取所需資訊
   * @param data {Array<any>}-課程數據
   */
  extractData(data: Array<any>) {
    const { isRangeReport } = this.uiFlag;
    const classTimeIntegration = new DataIntegration(IntegrationType.noRepeatEffectAvgData);
    const avgHrIntegration = new DataIntegration(IntegrationType.effectAvgData);
    const totalCaloriesIntegration = new DataIntegration(IntegrationType.totalData);
    const avgSpeedIntegration = new DataIntegration(IntegrationType.effectAvgData);
    const totalDistanceIntegration = new DataIntegration(IntegrationType.totalData);
    const avgWattIntegration = new DataIntegration(IntegrationType.effectAvgData);
    const rangeHrZone = [0, 0, 0, 0, 0, 0]; // 心率區間圖表數據
    const hrTrend = new Map<number, DataIntegration>();
    const caloriesTrend = new Map<number, DataIntegration>();
    const memberInfoMap = new Map(); // 各成員資訊，含概要資訊與圖表所需資訊

    data.forEach((_data) => {
      const {
        activityInfoLayer: {
          startTime,
          totalSecond,
          calories,
          avgHeartRateBpm,
          maxHeartRateBpm,
          totalHrZone0Second,
          totalHrZone1Second,
          totalHrZone2Second,
          totalHrZone3Second,
          totalHrZone4Second,
          totalHrZone5Second,
          avgSpeed,
          totalDistanceMeters,
          cycleAvgWatt,
          rowingAvgWatt,
        },
        fileInfo: { author },
      } = _data;
      classTimeIntegration.addNewData(totalSecond, { mark: startTime });
      avgHrIntegration.addNewData(avgHeartRateBpm || 0);
      totalCaloriesIntegration.addNewData(calories);
      avgSpeedIntegration.addNewData(avgSpeed || 0);
      totalDistanceIntegration.addNewData(totalDistanceMeters || 0);
      avgWattIntegration.addNewData(cycleAvgWatt || rowingAvgWatt || 0);
      rangeHrZone[0] += totalHrZone0Second;
      rangeHrZone[1] += totalHrZone1Second;
      rangeHrZone[2] += totalHrZone2Second;
      rangeHrZone[3] += totalHrZone3Second;
      rangeHrZone[4] += totalHrZone4Second;
      rangeHrZone[5] += totalHrZone5Second;

      const startDateTimestamp = dayjs(startTime).startOf('day').valueOf();
      if (isRangeReport) {
        if (!hrTrend.has(startDateTimestamp))
          hrTrend.set(startDateTimestamp, new DataIntegration(IntegrationType.effectAvgData));
        hrTrend.get(startDateTimestamp).addNewData(avgHeartRateBpm);
        if (!caloriesTrend.has(startDateTimestamp))
          caloriesTrend.set(startDateTimestamp, new DataIntegration(IntegrationType.avgData));
        caloriesTrend.get(startDateTimestamp).addNewData(calories);
      }

      const { origin: memberName, userId: memberId } = getFileInfoParam(author);
      if (!memberInfoMap.has(memberId))
        memberInfoMap.set(memberId, this.getMemberDataModel(memberName));
      const memberData = memberInfoMap.get(memberId);
      memberData.avgHrIntegration.addNewData(avgHeartRateBpm);
      memberData.totalCaloriesIntegration.addNewData(calories);
      memberData.avgSpeedIntegration.addNewData(avgSpeed);
      memberData.totalDistanceIntegration.addNewData(totalDistanceMeters);
      memberData.avgWattIntegration.addNewData(cycleAvgWatt || rowingAvgWatt || 0);
      memberData.maxHr = memberData.maxHr < maxHeartRateBpm ? maxHeartRateBpm : memberData.maxHr;
      memberData.hrZone[0] += totalHrZone0Second;
      memberData.hrZone[1] += totalHrZone1Second;
      memberData.hrZone[2] += totalHrZone2Second;
      memberData.hrZone[3] += totalHrZone3Second;
      memberData.hrZone[4] += totalHrZone4Second;
      memberData.hrZone[5] += totalHrZone5Second;

      if (isRangeReport) {
        if (!memberData.hrTrend.has(startDateTimestamp))
          memberData.hrTrend.set(
            startDateTimestamp,
            new DataIntegration(IntegrationType.effectAvgData)
          );
        memberData.hrTrend.get(startDateTimestamp).addNewData(avgHeartRateBpm);
        if (!memberData.caloriesTrend.has(startDateTimestamp))
          memberData.caloriesTrend.set(
            startDateTimestamp,
            new DataIntegration(IntegrationType.totalData)
          );
        memberData.caloriesTrend.get(startDateTimestamp).addNewData(calories);
      }
    });

    const memberCounts = memberInfoMap.size;
    this.summary = {
      memberCounts,
      classCount: classTimeIntegration.getResult().counts,
      classAvgDurationTime: classTimeIntegration.getResult().value,
      avgHr: avgHrIntegration.getResult(0).value,
      totalAvgCalories: totalCaloriesIntegration.getResult(0).value / memberCounts,
      avgSpeed: avgSpeedIntegration.getResult().value,
      totalAvgDistance: totalDistanceIntegration.getResult().value / memberCounts,
      avgWatt: avgWattIntegration.getResult().value,
    };

    this.hrZoneChartData = this.getHrZoneChartData(rangeHrZone);
    this.memberDataMap = this.restructureMemberData(memberInfoMap);
    if (isRangeReport) {
      this.hrTrendData = this.getTrendChartData(hrTrend);
      this.caloriesTrendData = this.getTrendChartData(caloriesTrend);
    } else {
      this.getReportDescription();
    }
  }

  /**
   * 取得成員數據計算模型
   * @param memberName {string}-成員暱稱
   */
  getMemberDataModel(memberName: string) {
    return {
      memberName,
      avgHrIntegration: new DataIntegration(IntegrationType.effectAvgData),
      totalCaloriesIntegration: new DataIntegration(IntegrationType.totalData),
      avgSpeedIntegration: new DataIntegration(IntegrationType.effectAvgData),
      totalDistanceIntegration: new DataIntegration(IntegrationType.totalData),
      avgWattIntegration: new DataIntegration(IntegrationType.effectAvgData),
      maxHr: 0,
      hrZone: [0, 0, 0, 0, 0, 0],
      hrTrend: new Map<number, DataIntegration>(),
      caloriesTrend: new Map<number, DataIntegration>(),
    };
  }

  /**
   * 將報告指定時間加至 url query string
   * @param action {boolean}-是否更新報告指定時間
   */
  updateUrl(action: boolean) {
    const { search, pathname } = location;
    const { isRangeReport, isDebugMode } = this.uiFlag;
    let newUrl = pathname;
    if (action) {
      const {
        reportTimeRange: { classTime, startTime, endTime },
      } = this;
      const queryObj = getUrlQueryStrings(search);
      if (isRangeReport) {
        queryObj.startTime = dayjs(startTime).valueOf();
        queryObj.endTime = dayjs(endTime).valueOf();
        delete queryObj.classTime;
      } else {
        queryObj.classTime = dayjs(classTime).valueOf();
        delete queryObj.startTime;
        delete queryObj.endTime;
      }

      newUrl += setUrlQueryString(queryObj);
      this.previewUrl = `${newUrl}&ipm=s`;
    } else if (isDebugMode) {
      newUrl += '?debug=';
    }

    if (history.pushState) window.history.pushState({ path: newUrl }, '', newUrl);
  }

  /**
   * 將個人分析列表全顯示
   */
  showMoreTableData() {
    this.showMore = true;
  }

  /**
   * 取得真實的上課時間
   */
  getClassRealDateTime() {
    const { fileInfo } = this;
    if (!fileInfo) return '';
    const [date, time] = fileInfo.creationDate.split('T');
    return `${date.replace(/-/g, '/')} ${time.slice(0, 5)}`;
  }

  /**
   * 使時間符合格式
   * @param time {number}-時間(s)
   */
  formatTime(time: number) {
    const roundTime = Math.round(time);
    const hour = Math.floor(roundTime / 3600);
    const minute = Math.floor((roundTime % 3600) / 60);
    const second = roundTime - hour * 3600 - minute * 60;
    const padStartTime = (roundTime: number) => roundTime.toString().padStart(2, '0');
    if (hour) {
      return `${hour}:${padStartTime(minute)}:${padStartTime(second)}`;
    } else if (minute) {
      return `${padStartTime(minute)}:${padStartTime(second)}`;
    } else {
      return `00:${padStartTime(second)}`;
    }
  }

  /**
   * 使檔案創建日期符合格式
   * @param date {string}-日期
   */
  formatDate(date: string) {
    const month = date.slice(5, 7);
    const day = date.slice(8, 10);
    return `${month}/${day}`;
  }

  /**
   * 將各心率區間值轉換為圖表用數據
   * @param hrZone {Array<number>}-心率區間數據
   */
  getHrZoneChartData(hrZone: Array<number>) {
    const totalHrSecond = hrZone.reduce((prev, current) => prev + current, 0);
    const [z0, z1, z2, z3, z4, z5] = hrZone;
    return [
      { y: countPercentage(z0, totalHrSecond), z: this.formatTime(z0) },
      { y: countPercentage(z1, totalHrSecond), z: this.formatTime(z1) },
      { y: countPercentage(z2, totalHrSecond), z: this.formatTime(z2) },
      { y: countPercentage(z3, totalHrSecond), z: this.formatTime(z3) },
      { y: countPercentage(z4, totalHrSecond), z: this.formatTime(z4) },
      { y: countPercentage(z5, totalHrSecond), z: this.formatTime(z5) },
    ];
  }

  /**
   * 取得所有卡路里區間
   */
  getAllCaloriesZone(caloriesMap: Map<number, number>) {
    const allZone = [];
    caloriesMap.forEach((value, key) => {
      const zone = key === 0 ? '0~99cal' : `${key}00~${key}99cal`;
      allZone.push({ name: zone, y: value, sliced: false, borderColor: 'rgba(255, 255, 255, 0)' });
    });

    return allZone;
  }

  /**
   * 將心率趨勢 Map 物件轉為圖表用數據
   * @param trendMap {Map<number, DataIntegration>}-心率區間趨勢數據
   */
  getTrendChartData(trendMap: Map<number, DataIntegration>, name = 'Avg') {
    const chartData = [];
    trendMap.forEach((_value, _key) => {
      chartData.push({
        x: _key,
        y: _value.getResult().value,
      });
    });

    return chartData;
  }

  /**
   * 將各學員的數據重組為可直接使用的數據
   * @param memberMap {Map<number, any>}-各學員運動數據
   */
  restructureMemberData(memberMap: Map<number, any>) {
    this.tableData.data.length = 0;
    const { isRangeReport } = this.uiFlag;
    const result = new Map<number, any>();
    const caloriesRangeMap = new Map(); // 卡路里區間圖表數據
    memberMap.forEach((_value, _memberId) => {
      const {
        memberName,
        avgHrIntegration,
        totalCaloriesIntegration,
        avgSpeedIntegration,
        totalDistanceIntegration,
        avgWattIntegration,
        maxHr,
        hrZone,
        hrTrend,
        caloriesTrend,
      } = _value;

      const _calories = totalCaloriesIntegration.getResult(0).value;
      const restructureObj = {
        id: +_memberId,
        name: memberName,
        avgHr: avgHrIntegration.getResult(0).value,
        calories: _calories,
        avgSpeed: avgSpeedIntegration.getResult().value,
        distance: totalDistanceIntegration.getResult().value,
        avgWatt: avgWattIntegration.getResult().value,
        maxHr,
        hrZone,
        compareHrZoneData: this.getHrZoneChartData(hrZone),
        hrTrend: isRangeReport ? this.getTrendChartData(hrTrend, memberName) : undefined,
        caloriesTrend: isRangeReport
          ? this.getTrendChartData(caloriesTrend, memberName)
          : undefined,
      };

      // 以每百卡路里為一統計區間
      const caloriesCategory = Math.floor(_calories / 100);
      caloriesRangeMap.set(caloriesCategory, (caloriesRangeMap.get(caloriesCategory) ?? 0) + 1);

      result.set(+_memberId, restructureObj);
      this.tableData.data.push(restructureObj);
    });

    this.caloriesChartData = this.getAllCaloriesZone(caloriesRangeMap);
    this.sortData();
    return result;
  }

  /**
   * 取得頁尾資訊
   * @param SN {string}-裝置sn碼
   * @param coachId {number}-教練使用者編號
   */
  getFooterInfo(SN, coachId) {
    // 取得裝置資訊
    const deviceDody = { token: '', queryType: '1', queryArray: SN };
    const bodyForCoach = { targetUserId: coachId };
    combineLatest([
      this.api70xxService.fetchGetProductInfo(deviceDody),
      this.api10xxService.fetchGetUserProfile(bodyForCoach),
    ]).subscribe((resArr) => {
      const [productInfo, userProfile] = resArr;
      const { groupIcon, groupName, groupRootInfo, groupDesc } = this.groupInfo;
      this.footerInfo = {
        ...this.handleDeviceInfo(productInfo),
        ...this.handleCoachInfo(userProfile),
        classInfo: [
          {
            name: groupName,
            imgUrl: groupIcon,
            description: groupDesc,
            brandName: groupRootInfo[2].brandName,
            branchName: groupRootInfo[3].branchName,
          },
        ],
      };
    });
  }

  /**
   * 處理頁尾裝置資訊
   * @param res {any}-api response
   */
  handleDeviceInfo(res: any) {
    if (!res || res.resultCode !== ResultCode.success) return {};
    const { productInfo } = res.info;
    const deviceInfo = [];
    productInfo.forEach((_info) => {
      const { modelName, modelID, modelTypeID, modelImg } = _info;
      const { hostname } = location;
      const finalHostname = hostname === WebIp.develop ? Domain.uat : hostname;
      deviceInfo.push({
        name: modelName,
        imgUrl: `http://${finalHostname}/app/public_html/products${modelImg}`,
        modelID,
        modelTypeID,
      });
    });

    return { deviceInfo };
  }

  /**
   * 處理頁尾教練資訊
   * @param res {any}-api response
   */
  handleCoachInfo(res: any) {
    const { processResult, userProfile } = res;
    if (!processResult || processResult.resultCode !== ResultCode.success) return {};
    const { nickname, avatarUrl, description } = userProfile;
    return { coachInfo: [{ name: nickname, imgUrl: avatarUrl, description }] };
  }

  /**
   * 根據使用者點選的連結導引至該頁面
   */
  visitLink() {
    const hashGroupId = this.hashIdService.handleGroupIdEncode(this.groupInfo.groupId);
    this.router.navigateByUrl(`/dashboard/group-info/${hashGroupId}/group-introduction`);
  }

  /**
   * 依據點選的項目進行排序
   */
  sortData() {
    if (this.sortTable && Object.prototype.hasOwnProperty.call(this.sortTable, 'active')) {
      const { active: sortCategory, direction } = this.sortTable;
      const { data } = this.tableData;
      const sortResult = [...this.tableData.data];
      if (direction === 'desc') sortResult.reverse();
      this.tableData.data = data.sort((_a, _b) => {
        const _aData = _a[sortCategory];
        const _bData = _b[sortCategory];
        if (typeof _aData === 'string') {
          if (direction === 'asc') return _aData >= _bData ? 1 : -1;
          return _aData < _bData ? 1 : -1;
        }

        return direction === 'asc' ? _aData - _bData : _bData - _aData;
      });
    }
  }

  /**
   * 依據點選的成員顯示資料
   * @param e {MouseEvent}-點擊事件
   */
  handleClickMember(e) {
    const id = +e.currentTarget.id;
    this.focusMember = this.focusMember === id ? null : id;
    this.changeDetectorRef.markForCheck();
  }

  print() {
    window.print();
  }

  /**
   * 取消rxjs訂閱和卸除highchart
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
