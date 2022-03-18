import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subject, combineLatest, fromEvent, Subscription } from 'rxjs';
import { takeUntil, switchMap, map, first } from 'rxjs/operators';
import { ReportConditionOpt } from '../../../../../shared/models/report-condition';
import dayjs from 'dayjs';
import { ReportService } from '../../../../../shared/services/report.service';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { GroupService } from '../../../../../shared/services/group.service';
import { ActivityService } from '../../../../../shared/services/activity.service';
import { CloudrunService } from '../../../../../shared/services/cloudrun.service';
import { HashIdService } from '../../../../../shared/services/hash-id.service';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { Unit } from '../../../../../shared/models/bs-constant';

type AnalysisTable = 'group' | 'member';
type AnalysisData = 
  'name'|
  'gender' |
  'age' |
  'completeNum' |
  'avgTime' |
  'totalTime' |
  'avgPace' |
  'avgHr' |
  'avgCalories' |
  'avgCadence' |
  'hrZone' |
  'runTimes' |
  'bestTime' |
  'totalCalories';
type NavigationPage = 'info' | 'sportsReport' | 'cloudrunReport';

enum GroupTableCol {
  name,
  completeNum,
  avgTime,
  totalTime,
  avgPace,
  avgHr,
  avgCalories,
  avgCadence,
  hrZone
};

enum MemberTableCol {
  name,
  gender,
  age,
  runTimes,
  bestTime,
  avgTime,
  totalTime,
  avgPace,
  avgHr,
  totalCalories,
  avgCadence,
  hrZone
};

@Component({
  selector: 'app-cloudrun-report',
  templateUrl: './cloudrun-report.component.html',
  styleUrls: ['./cloudrun-report.component.scss', '../group-child-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CloudrunReportComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();
  scrollEvent = new Subscription();
  clickEvent = new Subscription();
  resizeEvent = new Subscription();

  @ViewChild('groupSortTable') groupSortTable: MatSort;
  @ViewChild('memberSortTable') memberSortTable: MatSort;

  /**
   * ui 會用到的各個flag
   */
  uiFlag = {
    isPreviewMode: false,
    haveUrlCondition: false,
    reportCompleted: false,
    noData: true,
    defaultOpt: true
  }

  /**
   * 報告頁面可讓使用者篩選的條件
   */
  reportConditionOpt: ReportConditionOpt = {
    pageType: 'cloudRun',
    date: {
      startTimestamp: dayjs().startOf('month').valueOf(),
      endTimestamp: dayjs().endOf('month').valueOf(),
      type: 'thisMonth'
    },
    sportType: 1,
    cloudRun: {
      mapId: 1,
      month: dayjs().format('YYYYMM'),
      checkCompletion: true
    },
    age: {
      min: null,
      max: null
    },
    gender: null,
    hideConfirmBtn: false
  }

  /**
   * 使用者所選時間
   */
  selectDate = {
    startDate: dayjs().startOf('month').format('YYYY-MM-DDT00:00:00.000Z'),
    endDate: dayjs().endOf('month').format('YYYY-MM-DDT23:59:59.999Z')
  };

  /**
   * 團體分析數據
   */
  groupTableData = new MatTableDataSource<any>();  // matTable用資料

  /**
   * 個人分析數據
   */
  memberTableData = new MatTableDataSource<any>();  // matTable用資料

  /**
   * 未經篩選的數據
   */
  backUpData = {
    group: null,
    member: null
  }

  /**
   * 依group id當key的數據物件
   */
  groupDataObj: any;

  /**
   * 依use if當key的數據物件
   */
  memberDataObj: any;

  /**
   * 團體分析用到的flag
   */
  groupTable = {
    showOpt: false,
    showAll: false,
    showLevel: [30, 40, 60],
    showDataType: [
      0, 1, 3, 6, 7
    ],  // 預設顯示完賽人數、人均總時間、人均配速、人均步頻、心率圖表
    sortType: null,
    sorted: false
  };

  /**
   * 個人分析用到的flag
   */
  memberTable = {
    showOpt: false,
    showAll: false,
    showLevel: [30, 40, 60],
    showDataType: [
      2, 3, 4, 6, 10
    ],  // 預設顯示總筆數、最佳時間、平均時間、平均配速、心率圖表
    sortType: null,
    sorted: false
  }

  /**
   * 頁面所在群組的資訊
   */
  currentGroup = {
    name: '',
    id: '',
    icon: '',
    level: null,
    brandType: 2
  };

  /**
   * 點擊團體分析出現的選單
   */
  groupMenu = {
    show: false,
    focusId: null,
    x: null,
    y: null
  };

  /**
   * 點擊個人分析出現的選單
   */
  memberMenu = {
    show: false,
    focusId: null,
    x: null,
    y: null
  };

  /**
   * 分析列表顯示的欄位數目
   */
  tableColumn = {
    max: 5,
    min: 2
  };

  readonly tableLength = 8;
  readonly groupHeaderRowDef = [
    'name',
    'completeNum',
    'avgTime',
    'totalTime',
    'avgPace',
    'avgHr',
    'avgCalories',
    'avgCadence',
    'hrZone'
  ];

  memberHeaderRowDef = [
    'name',
    'gender',
    'age',
    'runTimes',
    'bestTime',
    'avgTime',
    'totalTime',
    'avgPace',
    'avgHr',
    'totalCalories',
    'avgCadence',
    'hrZone'
  ];

  /**
   * 團體分析篩選設定
   */
  groupTableOpt: any = {
    filter: [],
    column: []
  };

  /**
   * 個人分析篩選設定
   */
  memberTableOpt: any = {
    filter: [],
    column: []
  };

  userId: number;
  unit = <Unit>0;  // 使用者所使用的單位
  systemAccessRight = [99];
  allMapList: any;
  mapInfo: any;
  groupList: any;
  branchList: any;
  reportEndDate: string;
  reportTimeRange: string;
  createTime: string;
  windowWidth = 320;  // 視窗寬度
  currentMapId = 1;  // 另外設定map id 變數，避免污染子組件ngOnChanges event
  progress = 0;
  previewUrl = '';
  mapSource = 'google';
  compare = {
    urlList: [],
    clickList: []
  }
  readonly GroupTableCol = GroupTableCol;
  readonly MemberTableCol = MemberTableCol;
  constructor(
    private reportService: ReportService,
    private groupService: GroupService,
    private utils: UtilsService,
    private activityService: ActivityService,
    private cloudrunService: CloudrunService,
    private hashIdService: HashIdService,
    private translate: TranslateService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.windowWidth = window.innerWidth;
    this.getAnalysisOpt();
    this.checkWindowSize();
    this.checkQueryString(location.search);
    this.getNeedInfo();
  }

  /**
   * 訂閱視窗寬度
   * @author kidin-1100316
   */
  checkWindowSize() {
    const resize = fromEvent(window, 'resize');
    this.resizeEvent = resize.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      this.windowWidth = (e as any).target.innerWidth;
      this.assignChooseNum(this.windowWidth);
      this.changeDetectorRef.markForCheck();
    });

  }

  /**
   * 待多國語系載入後再產生多國語系
   * @author kidin-1100316
   */
  getTranslate() {
    let key_30: string,
        key_40: string,
        key_50: string;
    if (this.currentGroup.brandType === 1) {
      key_30 = 'universal_group_brand';
      key_40 = 'universal_group_branch';
      key_50 = 'universal_group_class';
    } else {
      key_30 = 'universal_group_enterprise';
      key_40 = 'universal_group_companyBranch';
      key_50 = 'universal_group_department';
    }

    this.groupTableOpt = {
      filter: [
        {
          i18n: this.translate.instant(key_30),
          level: 30
        },
        {
          i18n: this.translate.instant(key_40),
          level: 40
        },
        {
          i18n: this.translate.instant(key_50),
          level: 60
        }
      ],
      column: [
        {
          rowType: this.memberHeaderRowDef[GroupTableCol.name],
          i18n: this.translate.instant('universal_activityData_name')
        },
        {
          rowType: this.groupHeaderRowDef[GroupTableCol.completeNum],
          i18n: `${this.translate.instant('universal_operating_finished')} ${this.translate.instant('universal_activityData_people')}`
        },
        {
          rowType: this.groupHeaderRowDef[GroupTableCol.avgTime],
          i18n: `${this.translate.instant('universal_adjective_avg')} ${this.translate.instant('universal_activityData_timing')}`
        },
        {
          rowType: this.groupHeaderRowDef[GroupTableCol.totalTime],
          i18n: this.translate.instant('universal_activityData_limit_totalTime')
        },
        {
          rowType: this.groupHeaderRowDef[GroupTableCol.avgPace],
          i18n: this.translate.instant(
            this.unit === 0 ? 'universal_activityData_limit_avgKilometerPace' : 'universal_activityData_limit_avgMilePace'
          )
        },
        {
          rowType: this.groupHeaderRowDef[GroupTableCol.avgHr],
          i18n: this.translate.instant('universal_activityData_limit_avgHr')
        },
        {
          rowType: this.groupHeaderRowDef[GroupTableCol.avgCalories],
          i18n: `${this.translate.instant('universal_adjective_avg')} ${this.translate.instant('universal_userProfile_calories')}`
        },
        {
          rowType: this.groupHeaderRowDef[GroupTableCol.avgCadence],
          i18n: this.translate.instant('universal_activityData_limit_avgStepCadence')
        },
        {
          rowType: this.groupHeaderRowDef[GroupTableCol.hrZone],
          i18n: this.translate.instant('universal_activityData_hrZone')
        }
      ]
    };

    this.memberTableOpt = {
      filter: [
        {
          i18n: this.translate.instant(key_30),
          level: 30
        },
        {
          i18n: this.translate.instant(key_40),
          level: 40
        },
        {
          i18n: this.translate.instant(key_50),
          level: 60
        }
      ],
      column: [
        {
          rowType: this.memberHeaderRowDef[MemberTableCol.name],
          i18n: this.translate.instant('universal_activityData_name')
        },
        {
          rowType: this.memberHeaderRowDef[MemberTableCol.gender],
          i18n: this.translate.instant('universal_userProfile_gender')
        },
        {
          rowType: this.memberHeaderRowDef[MemberTableCol.age],
          i18n: this.translate.instant('universal_userProfile_age')
        },
        {
          rowType: this.memberHeaderRowDef[MemberTableCol.runTimes],
          i18n: this.translate.instant('universal_activityData_totalActivity')
        },
        {
          rowType: this.memberHeaderRowDef[MemberTableCol.bestTime],
          i18n: `${this.translate.instant('universal_adjective_maxBest')} ${this.translate.instant('universal_activityData_timing')}`
        },
        {
          rowType: this.memberHeaderRowDef[MemberTableCol.avgTime],
          i18n: `${this.translate.instant('universal_adjective_avg')} ${this.translate.instant('universal_activityData_timing')}`
        },
        {
          rowType: this.memberHeaderRowDef[MemberTableCol.totalTime],
          i18n: this.translate.instant('universal_activityData_limit_totalTime')
        },
        {
          rowType: this.memberHeaderRowDef[MemberTableCol.avgPace],
          i18n: this.translate.instant(
            this.unit === 0 ? 'universal_activityData_limit_avgKilometerPace' : 'universal_activityData_limit_avgMilePace'
          )
        },
        {
          rowType: this.memberHeaderRowDef[MemberTableCol.avgHr],
          i18n: this.translate.instant('universal_activityData_limit_avgHr')
        },
        {
          rowType: this.memberHeaderRowDef[MemberTableCol.totalCalories],
          i18n: this.translate.instant('universal_activityData_totalCalories')
        },
        {
          rowType: this.memberHeaderRowDef[MemberTableCol.avgCadence],
          i18n: this.translate.instant('universal_activityData_limit_avgStepCadence')
        },
        {
          rowType: this.memberHeaderRowDef[MemberTableCol.hrZone],
          i18n: this.translate.instant('universal_activityData_hrZone')
        }
      ]
    };

  }

  /**
   * 確認是否有query string
   * @param queryString {string}-url query string
   * @author kidin-1100304
   */
  checkQueryString(queryString: string) {
    const query = queryString.split('?')[1];
    if (query) {
      const queryArr = query.split('&');
      queryArr.forEach(_query => {
        const _queryArr = _query.split('='),
              [_key, _value] = [..._queryArr];
        switch (_key) {
          case 'ipm':
            this.uiFlag.isPreviewMode = true;
            break;
          case 'startdate':
            this.selectDate.startDate = dayjs(_value, 'YYYY-MM-DD').startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
            this.reportConditionOpt.date.startTimestamp = dayjs(this.selectDate.startDate).valueOf();
            this.reportConditionOpt.date.type = 'custom';
            break;
          case 'enddate':
            this.selectDate.endDate = dayjs(_value, 'YYYY-MM-DD').endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
            this.reportConditionOpt.date.endTimestamp = dayjs(this.selectDate.endDate).valueOf();
            this.reportConditionOpt.date.type = 'custom';
            break;
          case 'mapid':
            this.currentMapId = +_value;
            this.reportConditionOpt.cloudRun.mapId = +_value;
            this.uiFlag.haveUrlCondition = true;
            break;
          case 'source':
            this.mapSource = _value;
            break;
          case 'compare':
            this.compare.urlList = _value.split('p').map(_value => _value);
            break;
          case 'seemore':
            if (_value.includes('g')) this.groupTable.showAll = true;
            if (_value.includes('m')) this.memberTable.showAll = true;
            break;
          case 'check':
            this.reportConditionOpt.cloudRun.checkCompletion = _value === 'true';
            break;
        }

      });

    }

  }

  /**
   * 取得使用者個人資訊與群組所有階層資訊，並確認多國語系載入
   * @author kidin-11100308
   */   
  getNeedInfo() {
    combineLatest([
      this.groupService.getUserSimpleInfo(),
      this.groupService.getAllLevelGroupData(),
      this.cloudrunService.getAllMapInfo(),
      this.groupService.getRxGroupDetail(),
      this.translate.get('hellow world')
    ]).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(resArr => {
      this.getTranslate();
      const { unit, userId, accessRight } = resArr[0],
            { brands, branches, coaches } = resArr[1],
            { groupName, groupIcon, groupId, brandType } = resArr[3],
            level = +this.utils.displayGroupLevel(groupId);
      
      this.userId = userId;
      this.unit = unit;
      this.systemAccessRight = accessRight;
      // 僅管理員以上權限可以看性別與年齡數據
      if (accessRight[0] > level) {
        this.memberHeaderRowDef = 
          this.memberHeaderRowDef.filter(_rowDef => !['gender', 'age'].includes(_rowDef));
      }

      this.allMapList = resArr[2];
      if (!this.uiFlag.isPreviewMode && !this.uiFlag.haveUrlCondition) {
        this.reportConditionOpt.cloudRun.mapId = this.allMapList.leaderboard[0].mapId;  // 預設顯示本月例行賽報告
      }
      
      this.currentGroup = {
        name: groupName,
        icon: groupIcon,
        id: groupId,
        level,
        brandType: brandType
      }

      this.branchList = branches;
      this.groupList = {
        coaches: coaches
      };

      if (this.currentGroup.level === 30) {
        Object.assign(this.groupList, {brands: brands[0]});
        Object.assign(this.groupList, {branches: branches});
      } else if (this.currentGroup.level === 40) {
        Object.assign(this.groupList, {branches: branches});
      }

      this.reportService.setReportCondition(this.reportConditionOpt);
      this.getReportSelectedCondition();
    });

  }

  /**
   * 取得使用者所篩選的條件
   * @author kidin-1100308
   */
  getReportSelectedCondition() {
    this.reportService.getReportCondition().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      if (res.date) {
        this.selectDate = {
          startDate: dayjs(res.date.startTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
          endDate: dayjs(res.date.endTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ')
        };
  
        this.handleSubmitSearch('click');
      }

    });

  }

  /**
   * 使用者送出表單後顯示相關資料
   * @param act {string}-觸發此函式的動作
   * @author kidin-1100308
   */
  handleSubmitSearch (act: string) {
    if ([0, 100].includes(this.progress)) { // 避免重複call運動報告
      this.uiFlag.reportCompleted = false;
      this.createReport();

      if (act === 'click') {
        this.updateUrl();
      }

    }

  }

  /**
   * 更新預覽列印網址
   * @author kidin-1100308
   */
  updateUrl() {
    const { startDate, endDate } = this.selectDate,
          startDateString = startDate.split('T')[0],
          endDateString = endDate.split('T')[0],
          { checkCompletion: check } = this.reportConditionOpt.cloudRun;
    let searchString =
      `?ipm=s&startdate=${startDateString}&enddate=${endDateString}&mapid=${this.currentMapId}&source=${this.mapSource}&check=${check}`;

    let compare: string;
    const { clickList } = this.compare;
    if (clickList.length !== 0) {
      compare = `&compare=${clickList.join('p')}`;
      searchString = searchString + compare;
    }

    const showAllArr = [];
    if (this.groupTable.showAll) showAllArr.push('g');
    if (this.memberTable.showAll) showAllArr.push('m');
    if (showAllArr.length > 0) searchString = `${searchString}&seemore=${showAllArr.join('')}`;

    this.previewUrl = location.pathname + searchString;
  }

  /**
   * 建立雲跑報告
   * @author kidin-1100308
   */
  createReport() {
    const { mapId } = this.reportConditionOpt.cloudRun;
    const { gpxPath, distance, incline, mapImg, info } = this.allMapList.list[mapId - 1];
    if (gpxPath) {
      this.progress = 30;
      this.initVar();
      const { startDate, endDate } = this.selectDate;
      this.currentMapId = mapId;
      const body = {
        token: this.utils.getToken(),
        privacyCheck: 2,
        searchTime: {
          type: 1,
          fuzzyTime: [],
          filterStartTime: startDate,
          filterEndTime: endDate
        },
        searchRule: {
          activity: 1,
          targetUser: 3,
          groupId: this.getFuzzyGroupId(),
          fileInfo: {
            fileId: [],
            author: '',
            dispName: '',
            equipmentSN: '',
            class: '',
            teacher: '',
            tag: '',
            cloudRunMapId: this.currentMapId
          }
        },
        display: {
          activityLapLayerDisplay: 3,
          activityLapLayerDataField: [],
          activityPointLayerDisplay: 3,
          activityPointLayerDataField: []
        },
        page: 0,
        pageCounts: 10000
      };

      this.cloudrunService.getMapGpx({gpxPath}).pipe(
        switchMap(gpx => {
          return this.activityService.fetchMultiActivityData(body).pipe(  // 取得使用者數據
            map(data => {
              if (data.resultCode !== 200) {
                this.uiFlag.noData = true;
                const {resultCode, apiCode, resultMessage} = data;
                this.utils.handleError(resultCode, apiCode, resultMessage);
                return [gpx, []];
              } else {
                this.uiFlag.noData = false;
                return [gpx, data.info.activities];
              }

            })

          )

        })
      ).subscribe(response => {
        const { point, altitude } = response[0],
              { city, country, introduce, mapName } = info[this.checkLanguage()];
        this.mapInfo = {
          city,
          country,
          introduce,
          mapName,
          distance,
          incline,
          mapImg,
          point,
          altitude
        };
        this.handleReportTime();
        this.progress = 50;
        this.getGroupMemList(this.sortOriginData(response[1]));
        this.changeDetectorRef.markForCheck();
      });
      
    } else {
      const msg = 'Can not get cloud run gpx file.<br>Please try again later.';
      this.utils.openAlert(msg);
    }

  }

  /**
   * 初始化變數
   * @author kidin-1100315
   */
  initVar() {
    this.memberTableData.data.length = 0;
    this.groupTableData.data.length = 0;
    this.groupTable.sorted = false;
    this.memberTable.sorted = false;
    this.groupTable.showLevel = [30, 40, 60].filter(_level => _level >= this.currentGroup.level);
    this.memberTable.showLevel = [30, 40, 60].filter(_level => _level >= this.currentGroup.level);
    if (!this.uiFlag.isPreviewMode) {
      this.groupTable.showAll = false;
      this.memberTable.showAll = false;
    }

  }

  /**
   * 處理顯示的報告日期範圍及建立日期
   * @author kidin-1100311
   */
  handleReportTime() {
    this.translate.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.createTime = dayjs().format('YYYY-MM-DD HH:mm');
      const { startDate, endDate } = this.selectDate,
            range = dayjs(endDate).diff(startDate, 'day') + 1;
      this.reportEndDate = endDate.split('T')[0];
      this.reportTimeRange = `${range} ${this.translate.instant('universal_time_day')}`;
    });

  }

  /**
   * 整理原始api資料（統計及過濾）
   * @param data {any}-api 2111回傳內容
   * @author kidin-1100309
   */
  sortOriginData(data: any) {
    const middleData = {};
    data.forEach(_data => {
      const { privacyMatch } = _data;
      if (!privacyMatch || privacyMatch === 'false') {
        const { userId } = _data;
        if (!middleData.hasOwnProperty(userId)) {
          Object.assign(middleData, {
            [userId]: {
              info: {
                name: '',
                icon: ''
              },
              privacy: false,
              record: [],
              belongGroup: [],
              level: []
            }

          });
          
        }

      } else {
        const { activityInfoLayer, fileInfo } = _data,
              userId = this.getUserId(fileInfo),
              record = this.getUserRecord(activityInfoLayer);
        if (record) {
          const { fileId, privacy: filePrivacy } = fileInfo;
          Object.assign(record, {fileId, filePrivacy});
        }

        if (!middleData.hasOwnProperty(userId)) {
          Object.assign(middleData, {
            [userId]: {
              info: {
                name: '',
                icon: ''
              },
              privacy: true,
              record: record ? [record] : [],
              belongGroup: [],
              level: []
            }

          });
        } else {
          middleData[userId]['privacy'] = true;
          if (record) middleData[userId]['record'].push(record);
        }

      }

    });

    return this.mergeData(middleData) as any;
  }

  /**
   * 將個別的個人資料合併成所需資料
   * @param middleData {any}-根據user id篩選排列過後的資料
   * @author kidin-1100309
   */
  mergeData(middleData: any) {
    const finalData = {};
    for (let _user in middleData) {

      if (middleData.hasOwnProperty(_user)) {
        const { privacy, record, belongGroup, level } = middleData[_user],
              runTimes = record ? record.length : 0;
        if (privacy && runTimes > 0) {
          let totalSeconds = 0,
              totalSpeed = 0,
              totalCalories = 0,
              totalHr = 0,
              totalCadence = 0,
              totalZ0 = 0,
              totalZ1 = 0,
              totalZ2 = 0,
              totalZ3 = 0,
              totalZ4 = 0,
              totalZ5 = 0,
              bestFile = {
                time: null,
                fileId: null,
                filePrivacy: null,
                avgHr: null,
                avgSpeed: null,
                calories: null,
                runAvgCadence: null,
                hrZone: {
                  z0: null,
                  z1: null,
                  z2: null,
                  z3: null,
                  z4: null,
                  z5: null
                }
              };
          record.forEach(_record => {
            const {
              avgHeartRateBpm,
              avgSpeed,
              calories,
              fileId,
              filePrivacy,
              runAvgCadence,
              totalHrZone0Second,
              totalHrZone1Second,
              totalHrZone2Second,
              totalHrZone3Second,
              totalHrZone4Second,
              totalHrZone5Second,
              totalSecond
            } = _record;
            if (bestFile.time === null || totalSecond < bestFile.time) {
              bestFile = {
                time: totalSecond,
                fileId,
                filePrivacy,
                avgHr: avgHeartRateBpm,
                avgSpeed,
                calories,
                runAvgCadence,
                hrZone: {
                  z0: totalHrZone0Second,
                  z1: totalHrZone1Second,
                  z2: totalHrZone2Second,
                  z3: totalHrZone3Second,
                  z4: totalHrZone4Second,
                  z5: totalHrZone5Second
                }
                
              }

            }

            totalSeconds += totalSecond;
            totalSpeed += avgSpeed;
            totalCalories += calories;
            totalHr += avgHeartRateBpm;
            totalCadence += runAvgCadence;
            totalZ0 += totalHrZone0Second;
            totalZ1 += totalHrZone1Second;
            totalZ2 += totalHrZone2Second;
            totalZ3 += totalHrZone3Second;
            totalZ4 += totalHrZone4Second;
            totalZ5 += totalHrZone5Second;
          });

          const result = {
            runTimes,
            bestFile,
            totalSeconds,
            avgSecond: totalSeconds / runTimes || null,
            avgSpeed: totalSpeed / runTimes || null,
            totalCalories,
            avgHr: totalHr / runTimes,
            avgCadence: totalCadence / runTimes || null,
            hrZone: {
              z0: totalZ0,
              z1: totalZ1,
              z2: totalZ2,
              z3: totalZ3,
              z4: totalZ4,
              z5: totalZ5
            }
          };
          Object.assign(finalData, {[_user]: {privacy, belongGroup, level, record: result}})
        } else {
          Object.assign(finalData, {[_user]: {privacy, belongGroup, level, record: null}});
        }

      }

    }

    return finalData;
  }

  /**
   * 取得群組所有成員清單
   * @param memberData {any}-使用者數據
   * @author kidin-1100309
   */
  getGroupMemList(memberData: any) {
    this.groupService.getMemList().pipe(
      first(),
      switchMap(res => {
        const { id: currentGroupId } = this.currentGroup;
        if (res.groupId === currentGroupId) {
          return res;
        } else {
          const body = {
            token: this.utils.getToken(),
            groupId: currentGroupId,
            groupLevel: this.utils.displayGroupLevel(currentGroupId),
            infoType: 5,
            avatarType: 3
          };
          return this.groupService.fetchGroupMemberList(body).pipe(
            map(resp => {
              if (resp.resultCode !== 200) {
                this.utils.handleError(resp.resultCode, resp.apiCode, resp.resultMessage);
                return [];
              } else {
                const filterList = resp.info.groupMemberInfo.filter(_mem => _mem.joinStatus === 2);
                this.groupService.setMemList(filterList);
                return filterList;
              }
              
            })
          )
        }

      }),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(result => {
      this.progress = 70;
      this.sortGroupData(result, memberData);
      this.progress = 100;
      this.changeDetectorRef.markForCheck();
    });

  }

  /**
   * 根據群組id統計數據
   * @param memList {any}-成員清單
   * @param memberData {any}-使用者數據
   * @author kidin-1100309
   */
  sortGroupData(memList: any, memberData: any) {
    const middleObj = {};

    // 30階
    if (this.groupList.brands) {
      const {groupId, groupName} = this.groupList.brands;
      Object.assign(middleObj, {
        [groupId]: {
          name: groupName,
          member: [],
          record: {
            hrZone: {
              z0: 0,
              z1: 0,
              z2: 0,
              z3: 0,
              z4: 0,
              z5: 0
            },
            completeNum: 0,
            totalCalories: 0,
            totalSeconds: 0,
            totalHr: 0,
            totalSpeed: 0,
            totalCadence: 0
          }
        }

      });

    }

    // 40階
    if (this.groupList.branches) {

      const { branches } = this.groupList;
      for (let i = 0, len = branches.length; i < len; i++) {
        const {groupId, groupName} = branches[i];
        Object.assign(middleObj, {
          [groupId]: {
            name: groupName,
            member: [],
            record: {
              hrZone: {
                z0: 0,
                z1: 0,
                z2: 0,
                z3: 0,
                z4: 0,
                z5: 0
              },
              completeNum: 0,
              totalCalories: 0,
              totalSeconds: 0,
              totalHr: 0,
              totalSpeed: 0,
              totalCadence: 0
            }

          }

        });

      }

    }

    // 50階
    const { coaches } = this.groupList;
    for (let j = 0, len = coaches.length; j < len; j++) {
      const {groupId, groupName} = coaches[j];
      let parentsName: string;
      for (let k = 0, branchesLen = this.branchList.length; k < branchesLen; k++) {
        const _branch = this.branchList[k];
        if (_branch.groupId === `${this.groupService.getPartGroupId(groupId, 4)}-0-0`) {
          parentsName = _branch.groupName;
          break;
        }
      }

      Object.assign(middleObj, {
        [groupId]: {
          name: groupName,
          parents: parentsName,
          member: [],
          record: {
            hrZone: {
              z0: 0,
              z1: 0,
              z2: 0,
              z3: 0,
              z4: 0,
              z5: 0
            },
            completeNum: 0,
            totalCalories: 0,
            totalSeconds: 0,
            totalHr: 0,
            totalSpeed: 0,
            totalCadence: 0
          }

        }

      });

    }

    this.groupCombineUser(middleObj, memList, memberData);
  }

  /**
   * 將群組和成員數據進行歸屬
   * @param groupList {any}-群組清單
   * @param memList {any}-成員清單
   * @author kidin-1100310
   */
  groupCombineUser(groupList: any, memList: any, memberData: any) {
    const refDate = dayjs(this.selectDate.startDate),
          { gender: genderFilter, age: { max: ageMax, min: ageMin } } = this.reportConditionOpt;
    for (let i = 0, len = memList.length; i < len; i++) {
      const { 
        groupId,
        memberId: _userId,
        memberIcon: _icon,
        memberName: _nickName,
        birthday,
        gender
      } = memList[i];
      const age = refDate.diff(dayjs(birthday, 'YYYYMMDD'), 'year'),  // 年齡以報告開始日為基準
            groupLevel = +this.utils.displayGroupLevel(groupId),
            brandsGroupId = `${this.groupService.getPartGroupId(groupId, 3)}-0-0-0`,
            branchesGroupId = `${this.groupService.getPartGroupId(groupId, 4)}-0-0`,
            outOfAge = (ageMax !== null && age > ageMax) || (ageMin !== null && age < ageMin),
            outOfGender = genderFilter !== null && gender !== genderFilter;
      if (groupList.hasOwnProperty(groupId) && !outOfAge && !outOfGender) {
        const _memData = memberData[_userId];
        /** 團體分析所需的成員清單及成績加總，上面階層會將下面階層成員包含進去 */
        if (
          groupList.hasOwnProperty(brandsGroupId)
          && !groupList[brandsGroupId].member.some(_list => _list.id === _userId)
        ) {
          const brandData =  groupList[brandsGroupId];
          brandData.member.push({id: _userId, name: _nickName, age});
          if (
            memberData.hasOwnProperty(_userId)
            && _memData.record
            && _memData.record.length !== 0
          ) {
            const { record } = brandData,
                  { bestFile } = _memData.record;
            brandData.record = this.addUpData(record, bestFile);
          }

        }
        
        if (
          groupList.hasOwnProperty(branchesGroupId)
          && !groupList[branchesGroupId].member.some(_list => _list.id === _userId)
        ) {
          const branchData = groupList[branchesGroupId];
          branchData.member.push({id: _userId, name: _nickName, age});
          if (
            memberData.hasOwnProperty(_userId)
            && _memData.record
            && _memData.record.length !== 0
          ) {
            const { record } = branchData,
                  { bestFile } = _memData.record;
            branchData.record = this.addUpData(record, bestFile);
          }

        }

        if (!groupList[groupId].member.some(_list => _list.id === _userId)) {
          const coachData = groupList[groupId];
          coachData.member.push({id: _userId, name: _nickName, age});
          if (
            memberData.hasOwnProperty(_userId)
            && _memData.record
            && _memData.record.length !== 0
          ) {
            const { record } = coachData,
                  { bestFile } = _memData.record;
            coachData.record = this.addUpData(record, bestFile);
          }
        }
        /******************************************************************/

        // 個人分析所需資訊，包含個人所屬群組
        if (memberData.hasOwnProperty(_userId)) {
          _memData.info = {
            name: _nickName,
            icon: _icon,
            age,
            gender
          };
          _memData.belongGroup.push({
            id: groupId,
            name: groupList[groupId].name
          });

          if (!_memData.level.includes(groupLevel)) !_memData.level.push(groupLevel);
        } else {

          /**無成績者視為隱私權已開放 */
          Object.assign(memberData, {
            [_userId]: {
              info: {
                name: _nickName,
                icon: _icon,
                age,
                gender
              },
              privacy: true,
              record: null,
              belongGroup: [{
                id: groupId,
                name: groupList[groupId].name
              }],
              level: [groupLevel]
            }

          });
          /***************************/
        }

      }

    }

    this.groupDataObj = groupList;
    this.memberDataObj = memberData;
    this.backUpData = {
      group: this.handleGroupTableData(groupList),
      member: this.handleMemTableData(memberData)
    };

    this.filterGroup('group');
    this.filterGroup('member');
  }

  /**
   * 將該群組使用者數據進行加總
   * @param groupData {any}-群組加總數據
   * @param userData {any}-使用者最佳數據
   * @author kidin-1100310
   */
  addUpData(groupData: any, userData: any) {
    let {
      hrZone: {
        z0,
        z1,
        z2,
        z3,
        z4,
        z5
      },
      completeNum,
      totalCalories,
      totalSeconds,
      totalHr,
      totalSpeed,
      totalCadence
    } = groupData;

    let {
      time,
      avgHr,
      avgSpeed,
      calories,
      runAvgCadence,
      hrZone: {
        z0: zone0,
        z1: zone1,
        z2: zone2,
        z3: zone3,
        z4: zone4,
        z5: zone5
      },
    } = userData;

    return {
      hrZone: {
        z0: z0 + zone0,
        z1: z1 + zone1,
        z2: z2 + zone2,
        z3: z3 + zone3,
        z4: z4 + zone4,
        z5: z5 + zone5
      },
      completeNum: completeNum + 1,
      totalCalories: totalCalories + calories,
      totalSeconds: totalSeconds + time,
      totalHr: totalHr + avgHr,
      totalSpeed: totalSpeed + avgSpeed,
      totalCadence: totalCadence + runAvgCadence
    };

  }

  /**
   * 將分類過後的群組數據再進行整理以方便呈現
   * @param groupData {any}-已分類的群組數據
   * @author kidin-1100311
   */
  handleGroupTableData(groupData: any) {
    const tableArr = [];
    for (let key in groupData) {

      if (groupData.hasOwnProperty(key)) {
        const {
          name,
          parents,
          member,
          record: {
            completeNum,
            hrZone: {
              z0,
              z1,
              z2,
              z3,
              z4,
              z5
            },
            totalCadence,
            totalCalories,
            totalHr,
            totalSeconds,
            totalSpeed
          }
        } = groupData[key];
        
        tableArr.push({
          groupId: key,
          level: +this.utils.displayGroupLevel(key),
          name,
          parents,
          memberNum: member.length,
          completeNum,
          totalSeconds,
          avgSecond: (totalSeconds / completeNum) || null,
          avgHr: (totalHr / completeNum) || null,
          avgCadence: (totalCadence / completeNum) || null,
          avgCalories: (totalCalories / completeNum) || null,
          avgSpeed: (totalSpeed / completeNum) || null,
          hrZone: [z0, z1, z2, z3, z4, z5],
          ratio: '0%'
        });

      }

    }

    return tableArr;
  }


  /**
   * 將分類過後的個人數據再進行整理以方便呈現
   * @param memData {any}-已分類的個人數據
   * @author kidin-1100311
   */
  handleMemTableData(memData: any) {
    const tableArr = [];
    for (let key in memData) {
      const { record, info } = memData[key];
      if (memData.hasOwnProperty(key) && record && info) {
        const {
          info: {
            name,
            icon,
            age,
            gender
          },
          level,
          record: {
            runTimes,
            bestFile,
            hrZone: {
              z0,
              z1,
              z2,
              z3,
              z4,
              z5
            },
            avgCadence,
            avgHr,
            avgSpeed,
            avgSecond,
            totalSeconds,
            totalCalories
          },
          privacy
        } = memData[key];
        
        tableArr.push({
          userId: key,
          level,
          name,
          icon,
          gender,
          age,
          runTimes,
          totalSeconds,
          bestSeconds: bestFile.time,
          bestSpeed: bestFile.avgSpeed,
          fileId: bestFile.fileId,
          filePrivacy: bestFile.filePrivacy,
          avgSecond,
          avgHr,
          avgCadence,
          totalCalories,
          avgSpeed,
          hrZone: [z0, z1, z2, z3, z4, z5],
          privacy
        });

      } else {

        if (!memData[key].info) {
          delete memData[key];  // 該成員數據為connect跨網域補傳數據，故移除。
        } else {
          const { info: {name, icon, age, gender }, privacy, level } = memData[key];
          tableArr.push({
            userId: key,
            name,
            icon,
            age,
            gender,
            level,
            runTimes: 0,
            totalSeconds: 0,
            bestSeconds: 0,
            bestSpeed: 0,
            fileId: null,
            filePrivacy: [1],
            avgSecond: 0,
            avgHr: 0,
            avgCadence: 0,
            totalCalories: 0,
            avgSpeed: 0,
            hrZone: [0, 0, 0, 0, 0, 0],
            privacy,
            ratio: '0%'
          });

        }

      }

    }

    return tableArr;
  }

  /**
   * 取得使用者的user id
   * @param info {any}-api 2111的fileInfo
   * @author kidin-1100309
   */
  getUserId(info: any) {
    const { author } = info;
    let userId: number;
    if (author.includes('?userId=')) {
      const arr = author.split('?userId=');
      userId = +arr[1];
    } else {
      userId = +author;
    }

    return userId;
  }

  /**
   * 取得所需的使用者的運動數據
   * @param record {any}-api 2011的activityInfoLayer
   * @author kidin-1100309
   */
  getUserRecord(record: any) {
    const {
      avgHeartRateBpm,
      avgSpeed,
      calories,
      runAvgCadence,
      totalDistanceMeters: distance,
      totalHrZone0Second,
      totalHrZone1Second,
      totalHrZone2Second,
      totalHrZone3Second,
      totalHrZone4Second,
      totalHrZone5Second,
      totalSecond,
      totalStep
    } = record;

    if (!this.reportConditionOpt.cloudRun.checkCompletion || this.checkRaceComplete(+distance, +totalStep)) {
      return {
        avgHeartRateBpm,
        avgSpeed,
        calories,
        runAvgCadence,
        totalHrZone0Second,
        totalHrZone1Second,
        totalHrZone2Second,
        totalHrZone3Second,
        totalHrZone4Second,
        totalHrZone5Second,
        totalSecond
      };
    } else {
      return null;
    }

  }

  /**
   * 確認是否跑完全程及是否作弊
   * @param distance {number}-總距離
   * @param totalStep {number}-總步數
   * @author kidin-1100309
   */
  checkRaceComplete(distance: number, totalStep: number): boolean {
    const mapDistance = parseFloat((+this.mapInfo.distance * 1000).toFixed(0));
    if (distance >= mapDistance && distance / 2 < totalStep) {
      return true;
    } else {
      return false;
    }

  }

  /**
   * 根據使用者所選group 返回搜尋groupId條件
   * @returns group id {string}
   * @author kidin-1100308
   */
  getFuzzyGroupId() {
    const { id, level } = this.currentGroup;
    switch (level) {
      case 30:
        return `${this.groupService.getPartGroupId(id, 3)}-*-*-*`;
      case 40:
        return `${this.groupService.getPartGroupId(id, 4)}-*-*`;
      case 50:
      case 60:
        return `${this.groupService.getPartGroupId(id, 5)}-*`;
      default:
        return id;
    }

  }

  /**
   * 根據語系回傳地圖對應語系的序列
   * @author kidin-1100309
   */
  checkLanguage() {
    const lan = this.utils.getLocalStorageObject('locale');
    switch (lan) {
      case 'zh-tw':
        return 0;
      case 'zh-cn':
        return 1;
      case 'es-es':
        return 3;
      default:
        return 2;
    }

  }

  /**
   * 預先建立分析table
   * @author kidin-1100315
   */
  createSortTable () {
    this.memberTableData.sort = this.memberSortTable;
    this.groupTableData.sort = this.groupSortTable;
  }

  /**
   * 根據視窗寬度決定分析列表可顯示的項目數目
   * @param width {number}-視窗寬度
   * @author kidin-1100316
   */
  assignChooseNum (width: number) {
    if (width < 500) {
      this.tableColumn = {
        max: 3,
        min: 2
      };

    } else if (width < 630) {
      this.tableColumn = {
        max: 4,
        min: 2
      };

    } else if (width < 950) {
      this.tableColumn = {
        max: 5,
        min: 2
      };

    } else {
      this.tableColumn = {
        max: 6,
        min: 3
      };

    }

    const { max } = this.tableColumn;
    if (this.uiFlag.defaultOpt) {
      this.setDefaultOpt(max);
    } else {
      this.hideExtraOpt(max);
    }

  }

  /**
   * 設定預設欄位
   * @param num {number}顯示欄位數目
   * @author kidin-1100319
   */
  setDefaultOpt(num: number) {
    switch (num) {
      case 6:
        this.groupTable.showDataType = [
          GroupTableCol.name,
          GroupTableCol.completeNum,
          GroupTableCol.avgTime,
          GroupTableCol.avgPace,
          GroupTableCol.avgCadence,
          GroupTableCol.avgHr
        ];
        this.memberTable.showDataType = [
          MemberTableCol.name,
          MemberTableCol.runTimes,
          MemberTableCol.bestTime,
          MemberTableCol.avgTime,
          MemberTableCol.avgPace,
          MemberTableCol.hrZone
        ];
        break;
      case 5:
        this.groupTable.showDataType = [
          GroupTableCol.name,
          GroupTableCol.completeNum,
          GroupTableCol.avgTime,
          GroupTableCol.avgPace,
          GroupTableCol.avgCadence
        ];
        this.memberTable.showDataType = [
          MemberTableCol.name,
          MemberTableCol.runTimes,
          MemberTableCol.bestTime,
          MemberTableCol.avgTime,
          MemberTableCol.avgPace
        ];
        break;
      case 4:
        this.groupTable.showDataType = [
          GroupTableCol.name,
          GroupTableCol.completeNum,
          GroupTableCol.avgTime,
          GroupTableCol.avgPace,
        ];
        this.memberTable.showDataType = [
          MemberTableCol.name,
          MemberTableCol.runTimes,
          MemberTableCol.bestTime,
          MemberTableCol.avgPace
        ];
        break;
      case 3:
        this.groupTable.showDataType = [
          GroupTableCol.name,
          GroupTableCol.completeNum,
          GroupTableCol.avgTime,
        ];
        this.memberTable.showDataType = [
          MemberTableCol.name,
          MemberTableCol.bestTime,
          MemberTableCol.avgPace
        ];
        break;
    }

    this.setAnalysisOpt();
  }

  /**
   * 隱藏超過最大顯示數目的欄位
   * @param max {number}-顯示欄位最大數目
   * @author kidin-1100319
   */
  hideExtraOpt(max: number) {
    this.groupTable.showDataType = this.groupTable.showDataType.slice(0, max);
    this.memberTable.showDataType = this.memberTable.showDataType.slice(0, max);
    this.setAnalysisOpt();
    this.changeDetectorRef.markForCheck();
  }

  // 依照群組階層決定可篩選的條件-kidin-1090609
  assignFilter (level: number) {
    const defaultFil = {
      group: [2], // 預設50階
      person: [2], // 預設50階
    };

    switch (level) {
      case 30:
        defaultFil.group = [
          0, 1, 2
        ]; // 預設30~50階
        defaultFil.person = [
          0, 1, 2
        ]; // 預設30~50階
        break;
      case 40:
        defaultFil.group = [1, 2]; // 預設40~50階
        defaultFil.person = [1, 2]; // 預設40~50階
        break;
      default:
        defaultFil.group = [2]; // 預設50階
        defaultFil.person = [2]; // 預設50階
        break;
    }

  }

  /**
   * 將群組或個人分析數據進行排序
   * @param table {AnalysisTable}-群組或個人分析
   * @author kidin-1100317
   */
  arrangeData(table: AnalysisTable) {
    this[`${table}Table`].sorted = true;
    this[`${table}Table`].sortType = this[`${table}SortTable`].active;
    const sortCategory = this.getSortType(this[`${table}Table`].sortType as AnalysisData),
          sortDirection = this[`${table}SortTable`].direction;
    this[`${table}TableData`].data = this.sortData(this[`${table}TableData`].data, sortCategory, sortDirection === 'asc');
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 依使用者點選的類別取得對應的排序依據
   * @param type {AnalysisData}-排序類別
   * @param table {AnalysisTable}-欲排序的列表
   * @return Array<string>-排序依據
   * @author kidin-1100317
   */
  getSortType(type: AnalysisData) {
    switch (type) {
      case 'name':
      case 'age':
      case 'gender':
      case 'avgHr':
      case 'avgCalories':
      case 'avgCadence':
      case 'runTimes':
      case 'totalCalories':
        return type;
      case 'avgTime':
        return 'avgSecond';
      case 'totalTime':
        return 'totalSeconds';
      case 'avgPace':
        return 'avgSpeed';
      case 'bestTime':
        return 'bestSeconds';
    }

  }

  /**
   * 將數據進行排序
   * @param data {Array<any>}
   * @param sortCategory {string}-排序依據
   * @param asc {boolean}-是否升冪
   * @author kidin-1100317
   */
  sortData(data: Array<any>, sortCategory: string, asc: boolean) {
    let sortDenominator = 0,
        swaped = true;
    const [...sortData] = data;
    for (let i = 0, len = sortData.length; i < len && swaped; i++) {
      swaped = false;
      for (let j = 0; j < len - 1 - i; j++) {
        let _dataA = sortData[j][sortCategory],
            _dataB = sortData[j + 1][sortCategory];
        // 排序時一併找出最大值
        const _valA = sortCategory === 'avgSpeed' ? 3600 / (_dataA || 3600) : _dataA,
              _valB = sortCategory === 'avgSpeed' ?  3600 / (_dataB || 3600) : _dataB;
        if (_valA > sortDenominator) {
          sortDenominator = _valA;
        } else if (_valB > sortDenominator) {
          sortDenominator = _valB;
        }

        // 無成績者皆必排最後
        const noDataCond = !_dataA && _dataB && _dataB !== 0,
              ascCond = asc && _dataB < _dataA,
              descCond = !asc && _dataB > _dataA,
              genderArrange = sortCategory === 'gender';
        if (genderArrange) {

          if (ascCond || descCond) {
            swaped = true;
            [sortData[j], sortData[j + 1]] = [sortData[j + 1], sortData[j]];
          }
          
        } else {

          if (noDataCond || (_dataB && ascCond) || descCond || genderArrange) {
            swaped = true;
            [sortData[j], sortData[j + 1]] = [sortData[j + 1], sortData[j]];
          }

        }

      }

    }

    if (['name', 'age', 'gender'].includes(sortCategory) && sortDenominator !== 0) {
      return sortData.map(_data => {
        const sortItemData = _data[sortCategory];
        let numerator: number;
        if (sortItemData) {
          numerator = sortCategory === 'avgSpeed' ? +(3600 / sortItemData).toFixed(0) : +sortItemData.toFixed(0);
        } else {
          numerator = 0;
        }

        _data.ratio = `${((numerator / sortDenominator) * 100).toFixed(0)}%`;
        return _data;
      });

    } else {
      return sortData;
    }

  }

  /**
   * 顯示或隱藏設定選單
   * @param e {MouseEvent}
   * @param type {AnalysisTable}-欲開啟的設定選單類別
   * @author kidin-1100311
   */
  handleShowOpt(e: MouseEvent, type: AnalysisTable) {
    e.stopPropagation();
    if (this[`${type}Table`].showOpt) {
      this[`${type}Table`].showOpt = false;
      this.unsubscribeEvent();
    } else {
      this.initShowMenu();
      this[`${type}Table`].showOpt = true;
      this.handleScrollEvent();
      this.handleClickEvent();
    }

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 點擊個人分析的成員顯示選單
   * @param e {MouseEvent}
   * @param id {string | number}-user id 或 group id
   * @author kidin-1100316
   */
  showAnalysisInfoMenu(e: MouseEvent, table: AnalysisTable, id: number | string) {
    e.stopPropagation();
    this.initShowMenu();

    let x = `${e.clientX}px`,
        y = `${e.clientY}px`;

    // 點選位置太靠右則將選單往左移。
    if (e.view.innerWidth - e.clientX < 270) {
      x = `${e.view.innerWidth - 270}px`;
    }

    // 點選位置太靠下則將選單往上移。
    if (e.view.innerHeight - e.clientY < 310) {
      y = `${e.view.innerHeight - 310}px`;
    }

    this[`${table}Menu`] = {
      show: true,
      focusId: id,
      x,
      y
    };

    this.handleScrollEvent();
    this.handleClickEvent();
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 監聽捲動事件，如在選單外側捲動則關閉選單
   * @author kidin-1100318
   */
  handleScrollEvent() {
    const mainSection = document.querySelector('.main-body'),
          scroll = fromEvent(mainSection, 'scroll');
    this.scrollEvent = scroll.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      this.initShowMenu();
      this.scrollEvent.unsubscribe();
      this.changeDetectorRef.markForCheck();
    });

  }

  /**
   * 取消訂閱點擊和捲動事件
   * @author kidin
   */
  unsubscribeEvent() {
    this.scrollEvent.unsubscribe();
    this.clickEvent.unsubscribe();
  }

  /**
   * 監聽點擊事件，如在選單外側點擊則關閉選單
   * @author kidin-1100318
   */
  handleClickEvent() {
    const click = fromEvent(document, 'click');
    this.clickEvent = click.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      this.initShowMenu();
      this.clickEvent.unsubscribe();
      this.changeDetectorRef.markForCheck();
    });

  }

  /**
   * 初始化分析列表選單
   * @author kidin-1100318
   */
  initShowMenu() {
    this.groupMenu = {
      show: false,
      focusId: null,
      x: null,
      y: null
    };

    this.memberMenu = {
      show: false,
      focusId: null,
      x: null,
      y: null
    };

    this.groupTable.showOpt = false;
    this.memberTable.showOpt = false;
  }

  /**
   * 顯示全部
   * @param type { AnalysisTable }
   * @author kidin-1100316
   */
  showAllData (type: AnalysisTable) {
    this[`${type}Table`].showAll = true;
    this.updateUrl();
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 另開使用者所點選群組的分頁
   * @param id {string}-group id
   * @author kidin-1100316
   */
  goGroupPage(id: string, page: NavigationPage) {
    const hashGroupId = this.hashIdService.handleGroupIdEncode(id),
          startDateString = dayjs(this.selectDate.startDate).format('YYYY-MM-DD'),
          endDateString = dayjs(this.selectDate.endDate).format('YYYY-MM-DD'),
          reportConditionString = `?startdate=${startDateString}&enddate=${endDateString}`;
    switch (page) {
      case 'info':
        window.open(`/dashboard/group-info/${hashGroupId}/group-introduction`);
        break;
      case 'sportsReport':
        window.open(`/dashboard/group-info/${hashGroupId}/sports-report${reportConditionString}`);
        break;
      case 'cloudrunReport':
        window.open(`/dashboard/group-info/${hashGroupId}/cloudrun-report${reportConditionString}&mapid=${this.currentMapId}`);
        break;
    }
    
    this.initShowMenu();

  }

  /**
   * 另開使用者所點選群組的分頁
   * @param id {number}-user id
   * @author kidin-1100316
   */
  goMemberPage(id: number, page: NavigationPage) {
    const hashUserId = this.hashIdService.handleUserIdEncode(id.toString()),
          startDateString = dayjs(this.selectDate.startDate).format('YYYY-MM-DD'),
          endDateString = dayjs(this.selectDate.endDate).format('YYYY-MM-DD'),
          reportConditionString = `?startdate=${startDateString}&enddate=${endDateString}`;
    switch (page) {
      case 'info':
        window.open(`/user-profile/${hashUserId}`);
        break;
      case 'sportsReport':
        window.open(`/user-profile/${hashUserId}/sport-report${reportConditionString}`);
        break;
      /*  待個人cloud run report支援無登入瀏覽
      case 'cloudrunReport':
        window.open(`/user-profile/${hashUserId}/cloudrun-report${reportConditionString}&mapid=${this.currentMapId}`);
        break;
      */
    }

  }

  /**
   * 變更列表設定
   * @param e {MouseEvent}
   * @param table {AnalysisTable}
   * @param type {'filter' | 'column'}
   * @author kidin-1100318
   */
  changeTableOpt(e: any, table: AnalysisTable, type: 'filter' | 'column') {
    const value = +e.source.value;
    if (type === 'filter') {

      if (this[`${table}Table`].showLevel.includes(value)) {
        this[`${table}Table`].showLevel = this[`${table}Table`].showLevel.filter(_level => _level !== value);
      } else {
        this[`${table}Table`].showLevel.push(value);
        this[`${table}Table`].showLevel.sort();
      }

      this.filterGroup(table);
    } else {

      if (this[`${table}Table`].showDataType.includes(value)) {
        this[`${table}Table`].showDataType = this[`${table}Table`].showDataType.filter(_type => _type !== value);
      } else {
        this[`${table}Table`].showDataType.push(value);
        this[`${table}Table`].showDataType.sort();
      }

      this.setAnalysisOpt();
    }

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 存取使用者分析列表的欄位顯示設定至localstorage
   * @author kidin-1100319
   */
  setAnalysisOpt() {
    const opt = {
      group: this.groupTable.showDataType,
      member: this.memberTable.showDataType,
    };

    // 僅管理員以上權限可以看到年齡與性別的資訊，故分開儲存欄位設定
    if (this.systemAccessRight[0] <= this.currentGroup.level) {
      this.utils.setLocalStorageObject('cloudRunOpt', JSON.stringify(opt));
    } else {
      this.utils.setLocalStorageObject('cloudRunOpt-mem', JSON.stringify(opt));
    }
    
  }

  /**
   * 從localstorage取得使用者先前分析列表的欄位顯示設定
   * @author kidin-1100319
   */
  getAnalysisOpt () {
    let opt: any;
    if (this.systemAccessRight[0] <= this.currentGroup.level) {
      opt = this.utils.getLocalStorageObject('cloudRunOpt');
    } else {
      opt = this.utils.getLocalStorageObject('cloudRunOpt-mem');
    }

    if (opt) {
      this.uiFlag.defaultOpt = false;
      const { group, member } = JSON.parse(opt);
      this.groupTable.showDataType = group;
      this.memberTable.showDataType = member;
    } else {
      this.uiFlag.defaultOpt = true;
    }

    this.assignChooseNum(this.windowWidth);
  }

  /**
   * 根據使用者設定的群組階層針對數據進行篩選
   * @param table {AnalysisTable}-分析列表類別
   * @author kidin-1100319
   */
  filterGroup(table: AnalysisTable) {
    if (table === 'group') {
      this.groupTableData.data = this.backUpData.group.filter(_group => {
        return this.groupTable.showLevel.includes(_group.level);
      });

      if (this.groupTable.sorted) this.arrangeData('group');
    } else {
      this.memberTableData.data = this.backUpData.member.filter(_member => {
        const levelArr = _member.level;
        let isLevel = false;
        for (let i = 0, len = levelArr.length; i < len; i++) {

          if (this.memberTable.showLevel.includes(levelArr[i])) {
            isLevel = true;
            break;
          }

        }

        return isLevel;
      });

      if (this.memberTable.sorted) this.arrangeData('member');
    }
    
  }

  /**
   * 變更地圖來源
   * @param e {'google' | 'baidu'}
   * @author kidin-1100331
   */
  mapSourceChange(e: 'google' | 'baidu') {
    this.mapSource = e;
    this.updateUrl();
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 將比較之玩家從預覽列印網址序列加入或移除序列
   * @param e {number}-加入比較之玩家序列
   * @author kidin-1100331
   */
  comparePlayer(e: number) {
    const { clickList } = this.compare;
    if (e < 0) {
      this.compare.clickList = [];
    } else if (clickList.includes(e)) {
      this.compare.clickList = this.compare.clickList.filter(_list => _list !== e);
    } else {
      this.compare.clickList.push(e);
    }

    this.updateUrl();
  }

  /**
   * 列印
   * @author kidin-1100319
   */
  print() {
    window.print();
  }

  /**
   * 取消rxjs訂閱
   * @author kidin-1100309
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
