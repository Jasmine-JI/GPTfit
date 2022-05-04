import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import SimpleLinearRegression from 'ml-regression-simple-linear';
import dayjs from 'dayjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { Subject, Subscription, fromEvent, combineLatest, of, merge } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { HashIdService } from '../../../../../shared/services/hash-id.service';
import { ReportService } from '../../../../../shared/services/report.service';
import { GroupService } from '../../../../../shared/services/group.service';
import { ReportConditionOpt } from '../../../../../shared/models/report-condition';
import { mi, Unit } from '../../../../../shared/models/bs-constant';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';
import { GroupLevel, SettingObj } from '../../../../dashboard/models/group-detail';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { stepColor } from '../../../../../shared/models/chart-data';

@Component({
  selector: 'app-life-tracking',
  templateUrl: './life-tracking.component.html',
  styleUrls: ['./life-tracking.component.scss', '../group-child-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LifeTrackingComponent implements OnInit, OnDestroy {
  @ViewChild('groupSortTable', {static: false})
  groupSortTable: MatSort;
  @ViewChild('personSortTable', {static: false})
  personSortTable: MatSort;

  private ngUnsubscribe = new Subject();
  scrollAndClickEvent = new Subscription();
  resizeEvent = new Subscription();

  /**
   * UI控制相關flag
   */
  uiFlag = {
    isPreviewMode: false,
    progress: 100,
    noData: true,
    inited: false
  };

  /**
   * 報告頁面可讓使用者篩選的條件
   */
  reportConditionOpt: ReportConditionOpt = {
    brandType: 2,
    pageType: 'lifeTracking',
    date: {
      startTimestamp: dayjs().startOf('day').subtract(6, 'day').valueOf(),
      endTimestamp: dayjs().endOf('day').valueOf(),
      type: 'sevenDay'
    },
    group: {
      brands: null,
      branches: null,
      coaches: [],
      selectGroup: null
    },
    hideConfirmBtn: true
  };

  /**
   * 指定的群組概要
   */
  groupInfo = {
    name: null,
    icon: null,
    id: null,
    parents: null,
    level: null
  };

  /**
   * 報告概要資訊
   */
  info = {};

  /**
   * 圖表用數據
   */
  chart = {
    stepTrend: {
      totalStep: 0,
      totalDistance: 0,
      reachTimes: 0,
      trendData: []
    },
    sleepTrend: {
      ttlAvgSleepSecond: 0,
      ttlAvgDeepSleepSecond: 0,
      ttlAvgLightSleepSecond: 0,
      dataLen: 0,
      trendData: {
        deep: [],
        light: [],
        standUp: []
      }
    },
    bodyDiagram: [],
    BMITrend: {
      data: {
        top: 0,
        bottom: null,
        arr: []
      },
      zeroDataBefore: true,
      noData: true
    },
    fatRateTrend: {
      data: {
        top: 0,
        bottom: null,
        arr: []
      },
      zeroDataBefore: true,
      noData: true
    },
    muscleRateTrend: {
      data: {
        top: 0,
        bottom: null,
        arr: []
      },
      zeroDataBefore: true,
      noData: true
    },
    fitTimeTrend: {
      maxMin: 0,
      avgMin: 0,
      ttlSecond: 0,
      haveDataLen: 0,
      dataArr: []
    }
  }

   /**
    * 群組分析數據
    */
  groupAnalysis = {};

   /**
    * 個人分析數據
    */
  personAnalysis = {};

  /**
   * 團體分析篩選設定
   */
  groupTableOpt = [];

  /**
   * 個人分析篩選設定
   */
  personTableOpt = [];

  /**
   * 群組分析列表相關
   */
  groupTable = {
    showAll: false,
    showOpt: false,
    sorted: false,
    sortType: null,
    mouseInId: false,
    focusId: null,
    list: new MatTableDataSource<any>(),
    showDataDef: []
  }

  /**
   * 個人分析列表相關
   */
  personTable = {
    showAll: false,
    showOpt: false,
    sorted: false,
    sortType: null,
    mouseInId: false,
    focusId: null,
    list: new MatTableDataSource<any>(),
    showDataDef: []
  }

  /**
   * 點擊分析列表後顯示之菜單
   */
  analysisMenu = {
    type: null,
    focusId: '',
    x: null,
    y: null
  };

  /**
   * 頁面所需相關時間日期資訊
   */
  reportTime = {
    endDate: null,
    range: null,
    create: null,
    diffWeek: 0,
    type: <1 | 2>1, // 1: 日報告 2: 週報告
    typeTranslate: ''
  };

  /**
   * 使用者概要資訊
   */
  userInfo = {
    id: null,
    accessRight: null,
    unit: <Unit>Unit.metric
  }

  /**
   * 分析列表可設定的欄位數量範圍
   */
  tableColumn = {
    max: 3,
    min: 2
  }

  groupList = {
    analysisObj: {},
    regression: {},
    originList: null
  };

  memberList = {
    analysisObj: {},
    noRepeatList: []
  };

  readonly tableLength = 8; // 分析列表預設顯示長度
  readonly unitEnum = Unit;
  readonly mi = mi;
  dateLen = 0; // 報告橫跨天數/週數
  previewUrl: string;
  windowWidth = 320;  // 視窗寬度
  columnTranslate = {};  // 分析列表所需的欄位名稱翻譯

  constructor(
    private route: ActivatedRoute,
    private utils: UtilsService,
    private hashIdService: HashIdService,
    private reportService: ReportService,
    private translate: TranslateService,
    private groupService: GroupService,
    private userProfileService: UserProfileService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.checkWindowSize(window.innerWidth);
    this.subscribeWindowSize();
    this.checkQueryString(location.search);
    this.getNeedInfo();
  }

  /**
   * 根據視窗寬度調整分析列表最大與最小可顯示數量
   * @param width {number}-視窗寬度
   * @author kidin-1100616
   */
  checkWindowSize(width: number) {
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
    if (this.groupTableOpt.length > max) {
      this.groupTableOpt.length = max;
    }

    if (this.personTableOpt.length > max) {
      this.personTableOpt.length = max;
    }

  }
  
  /**
   * 訂閱視窗寬度
   * @author kidin-1100616
   */
  subscribeWindowSize() {
    const resize = fromEvent(window, 'resize');
    this.resizeEvent = resize.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      this.windowWidth = (e as any).target.innerWidth;
      this.checkWindowSize(this.windowWidth);
      this.changeDetectorRef.markForCheck();
    });

  }

  /**
   * 從query string取得參數
   * @param queryString {string}
   * @author kidin-1100616
   */
  checkQueryString(queryString: string) {
    const query = queryString.split('?')[1];
    if (query) {
      const queryArr = query.split('&');
      queryArr.forEach(_query => {
        const _queryArr = _query.split('='),
              [_key, _value] = _queryArr;
        switch (_key) {
          case 'ipm':
            this.uiFlag.isPreviewMode = true;
            break;
          case 'startdate':
            this.reportConditionOpt.date.startTimestamp = dayjs(_value, 'YYYY-MM-DD').startOf('day').valueOf();
            this.reportConditionOpt.date.type = 'custom';
            break;
          case 'enddate':
            this.reportConditionOpt.date.endTimestamp = dayjs(_value, 'YYYY-MM-DD').endOf('day').valueOf();
            this.reportConditionOpt.date.type = 'custom';
            break;
          case 'seemore':
            if (_value.includes('g')) this.groupTable.showAll = true;
            if (_value.includes('p')) this.personTable.showAll = true;
            break;
        }

      });

    }

  }

  /**
   * 取得目前所在群組與其他群組階層資訊
   * @author kidin-1100616
   */
  getNeedInfo() {
    combineLatest([
      this.groupService.getAllLevelGroupData(),
      this.userProfileService.getRxUserProfile(),
      this.translate.get('hellow world')
    ]).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(resArr => {
      this.createTranslate();
      this.groupList.originList = resArr[0];
      const { groupId, brands, branches, coaches } = resArr[0] as any,
            { userId, unit, heartRateBase, systemAccessRight } = resArr[1] as any,
            groupLevel = this.utils.displayGroupLevel(groupId),
            group = this.reportConditionOpt.group;

      this.userInfo = {
        id: userId,
        accessRight: systemAccessRight,
        unit
      };

      group.coaches = coaches;
      switch (groupLevel) {
        case GroupLevel.brand:
          group.brands = brands[0];
          group.branches = branches;
          group.selectGroup = groupId.split('-').slice(0, 3).join('-');
          break;
        case GroupLevel.branch:
          group.brands = null;
          group.branches = branches;
          group.selectGroup = groupId.split('-').slice(0, 4).join('-');
          break;
        default:
          group.brands = null;
          group.branches = null;
          group.selectGroup = groupId.split('-').slice(0, 5).join('-');
          break;
      }

      this.reportService.setReportCondition(this.reportConditionOpt);
      this.getReportSelectedCondition();
    });

  }

  /**
   * 建立分析列表欄位多國語系
   * @author kidin-1100617
   */
  createTranslate() {
    this.translate.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.columnTranslate = {
        name: this.translate.instant('universal_activityData_name'),
        memberNum: `
          ${this.translate.instant('universal_activityData_record')}
          ${this.translate.instant('universal_activityData_people')}
        `,
        totalStep: this.translate.instant('universal_activityData_activityTotalSteps'),
        totalFitTime: `
          ${this.translate.instant('universal_adjective_singleTotal')}
          ${this.translate.instant('universal_userProfile_fitTime')}
        `,
        avgSleep: `
          ${this.translate.instant('universal_adjective_avg')}
          ${this.translate.instant('universal_lifeTracking_sleep')}
        `,
        distance: this.translate.instant('universal_userProfile_walkingDistance'),
        fatRate: this.translate.instant('universal_lifeTracking_fatRate'),
        muscleRate: this.translate.instant('universal_userProfile_muscleRate'),
        restHr: this.translate.instant('universal_userProfile_restHr'),
        bodyAssessment: this.translate.instant('universal_activityData_posture'),
        BMI: 'BMI',
        FFMI: 'FFMI'
      }

    });

  }

  /**
   * 取得使用者所篩選的條件
   * @author kidin-1100616
   */
  getReportSelectedCondition() {
    this.reportService.getReportCondition().pipe(
      switchMap(res => {
        const { progress } = this.uiFlag;
        this.changeProgress(progress === 100 ? 10 : progress);
        this.initReportContent();
        const effectGroupId = (res as any).group.selectGroup.split('-'),
              completeGroupId = this.groupService.getCompleteGroupId(effectGroupId),
              { id: currentGroupId } = this.groupInfo;
              
        // 若所選群組不變，則沿用之前的成員清單
        if (currentGroupId === completeGroupId) {
          return of([res, this.memberList]);
        } else {
          this.groupInfo = this.assignGroupInfo(completeGroupId);
          const listBody = {
            token: this.utils.getToken(),
            groupId: completeGroupId,
            groupLevel: this.utils.displayGroupLevel(completeGroupId),
            infoType: 5,
            avatarType: 3
          };

          return this.groupService.fetchGroupMemberList(listBody).pipe(
            map(listRes => {
              const { apiCode, resultCode, resultMessage, info: { groupMemberInfo } } = listRes as any;
              if (resultCode !== 200) {
                this.uiFlag.noData = true;
                this.utils.handleError(resultCode, apiCode, resultMessage);
                return [res, []];
              } else {
                return [res, groupMemberInfo];
              }
  
            })
  
          )

        }

      }),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(resArr => {
      // 避免連續送出
      if (this.uiFlag.progress >= 10 && this.uiFlag.progress < 100) {
        this.changeProgress(30);
        const [condition, memberList] = resArr as any,
              { 
                date: { 
                  startTimestamp,
                  endTimestamp
                },
                group: {
                  selectGroup
                }
              } = condition;
        const { group: { selectGroup: preSelectGroup } } = this.reportConditionOpt;
        // 日期範圍大於52天則取週報告
        this.reportTime.type = dayjs(endTimestamp).diff(dayjs(startTimestamp), 'day') <= 52 ? 1 : 2;
        this.reportConditionOpt = this.utils.deepCopy(condition);
        // 若群組id不變，則使用已儲存之人員清單
        let memIdArr: Array<number>;
        if (selectGroup === preSelectGroup && this.uiFlag.inited) {
          memIdArr = [...this.memberList.noRepeatList];
        } else {
          if (!this.uiFlag.inited) this.uiFlag.inited = true;
          this.memberList.analysisObj = {};
          this.createGroupAnalysisObj(this.groupList.originList);
          const memIdSet = this.handlePersonAnalysisObj(memberList);
          memIdArr = (Array.from(memIdSet) as Array<number>).sort((a, b) => a - b);
          this.memberList.noRepeatList = this.utils.deepCopy(memIdArr);
        }

        this.personAnalysis = this.utils.deepCopy(this.memberList.analysisObj);
        this.getMemberData(memIdArr);
      }

    });

  }

  /**
   * 初始化報告變數
   * @author kidin-1100617
   */
  initReportContent() {
    this.info = {};
    this.groupAnalysis = {};
    this.personAnalysis = {};
    this.chart = {
      stepTrend: {
        totalStep: 0,
        totalDistance: 0,
        reachTimes: 0,
        trendData: []
      },
      sleepTrend: {
        ttlAvgSleepSecond: 0,
        ttlAvgDeepSleepSecond: 0,
        ttlAvgLightSleepSecond: 0,
        dataLen: 0,
        trendData: {
          deep: [],
          light: [],
          standUp: []
        }
      },
      bodyDiagram: [],
      BMITrend: {
        data: {
          top: 0,
          bottom: null,
          arr: []
        },
        zeroDataBefore: true,
        noData: true
      },
      fatRateTrend: {
        data: {
          top: 0,
          bottom: null,
          arr: []
        },
        zeroDataBefore: true,
        noData: true
      },
      muscleRateTrend: {
        data: {
          top: 0,
          bottom: null,
          arr: []
        },
        zeroDataBefore: true,
        noData: true
      },
      fitTimeTrend: {
        maxMin: 0,
        avgMin: 0,
        ttlSecond: 0,
        haveDataLen: 0,
        dataArr: []
      }

    }

  }

  /**
   * 取得面面所需的指定群組資訊
   * @param id {string}-group id
   * @author kidin-1100617
   */
   assignGroupInfo(id: string) {
    const {
      brands,
      branches,
      coaches
    } = this.groupList.originList;

    const { groupIcon: brandIcon, groupName: brandName } = brands[0],
          level = this.utils.displayGroupLevel(id);
    switch (level) {
      case GroupLevel.brand:
        return this.groupInfo = {
          name: brandName,
          id,
          icon: brandIcon,
          parents: null,
          level
        };
      case GroupLevel.branch:
        const { groupIcon: _branchIcon, groupName: _branchName } = this.getGroupInfo(id, branches);
        return this.groupInfo = {
          name: _branchName,
          id,
          icon: _branchIcon,
          parents: brandName,
          level
        };
      case GroupLevel.class:
        const { groupIcon: _coachIcon, groupName: _coachName } = this.getGroupInfo(id, coaches),
              branchGroupId = `${this.groupService.getPartGroupId(id, 4)}-0-0`,
              { groupName: branchName } = this.getGroupInfo(branchGroupId, branches);
        return this.groupInfo = {
          name: _coachName,
          id,
          icon: _coachIcon,
          parents: `${brandName}\\${branchName}`,
          level
        };

    }

  }

  /**
   * 查找指定id在群組列表的序列位置
   * @param id {string}-groupId
   * @param list {Array<any>}-group list
   * @author kidin-1100617
   */
   getGroupInfo(id: string, list: Array<any>) {
    for (let i = 0, len = list.length; i < len; i++) {
      const { groupId } = list[i];
      if (groupId === id) {
        return list[i];
      }
    }

  }

  /**
   * 事先建立團體分析物件，以便後續計算數據與處理成員清單
   * @param groupList {any}-api 1103回覆的群組列表
   * @author kidin-1100511
   */
   createGroupAnalysisObj(groupList: any) {
    this.groupList.analysisObj = {};
    const { brands, branches, coaches } = groupList,
          { id, level, name, parents } = this.groupInfo;
    switch (level) {
      case GroupLevel.class:
        this.groupList.analysisObj = {
          [id]: {
            name,
            parentsName: parents.split('\\')[1],
            memberList: [],
            memberSet: new Set<number>()
          },
          ...this.groupList.analysisObj
        };
        break;
      case GroupLevel.branch:
        coaches.forEach(_coach => {
          const { groupId: _coachId, groupName: _coachName } = _coach,
                _parentId = `${this.groupService.getPartGroupId(_coachId, 4)}-0-0`;
          if (_parentId === id) {
            this.groupList.analysisObj = {
              [_coachId]: {
                name: _coachName,
                parentsName: name,
                memberList: [],
                memberSet: new Set<number>()
              },
              ...this.groupList.analysisObj
            };

          }
    
        });

        this.groupList.analysisObj = {
          [id]: {
            name: name,
            parentsName: parents,
            memberList: [],
            memberSet: new Set<number>()
          },
          ...this.groupList.analysisObj
        };
        break;
      case GroupLevel.brand:
        coaches.forEach(_coach => {
          const { groupId: _coachId, groupName } = _coach;
          let parentsName: string;
          for (let i = 0, len = branches.length; i < len; i++) {
            const { groupId: _branchId, groupName: _branchName } = branches[i],
                  partCoachId = this.groupService.getPartGroupId(_branchId, 4),
                  partBranchId = this.groupService.getPartGroupId(_coachId, 4);

            if (partBranchId === partCoachId) {
              parentsName = _branchName;
              break;
            }

          }
    
          this.groupList.analysisObj = {
            [_coachId]: {
              name: groupName,
              parentsName,
              memberList: [],
              memberSet: new Set<number>()
            },
            ...this.groupList.analysisObj
          };
    
        });

        const { groupId: brandId, groupName: brandName } = brands[0];
        branches.forEach(_branch => {
          const { groupId: _branchId, groupName } = _branch;
          this.groupList.analysisObj = {
            [_branchId]: {
              name: groupName,
              parentsName: brandName,
              memberList: [],
              memberSet: new Set<number>()
            },
            ...this.groupList.analysisObj
          };
  
        });

        this.groupList.analysisObj = {
          [brandId]: {
            name: brandName,
            parentsName: '',
            memberList: [],
            memberSet: new Set<number>()
          },
          ...this.groupList.analysisObj
        };
        break;
    }

  }

  /**
   * 建立個人分析物件以方便後續數據計算，並回傳不重複之成員id
   * @param memList {Array<any>}-api 1103回傳的資料
   * @param level {number}-群組階層
   * @author kidin-1100617
   */
   handlePersonAnalysisObj(memList: Array<any>) {
    const { id, level } = this.groupInfo,
          memIdSet = new Set();
    memList.forEach(_list => {
      const { groupId: _memGroupId, memberId, memberName } = _list;
      // 取得不重複的所有成員id，用來call api 2104
      memIdSet.add(memberId);

      // 依據成員所屬群組進行歸納，已便顯示分析選單
      this.groupList.analysisObj[_memGroupId].memberSet.add(memberId);
      const { name: _grouphName } = this.groupList.analysisObj[_memGroupId];
      switch (level) {
        case GroupLevel.class:
          if (_memGroupId === id) {
            this.createPersonAnalysisObj(memberId, memberName, _grouphName, _memGroupId);
          }
          break;
        case GroupLevel.branch:
          const parentsGroupId = `${this.groupService.getPartGroupId(_memGroupId, 4)}-0-0`;
          this.groupList.analysisObj[parentsGroupId].memberSet.add(memberId);
          if (parentsGroupId === id) {
            this.createPersonAnalysisObj(memberId, memberName, _grouphName, _memGroupId);
          }
          break;
        case GroupLevel.brand:
          const branchGroupId = `${this.groupService.getPartGroupId(_memGroupId, 4)}-0-0`,
                brandGroupId = `${this.groupService.getPartGroupId(_memGroupId, 3)}-0-0-0`;
          this.groupList.analysisObj[branchGroupId].memberSet.add(memberId);
          this.groupList.analysisObj[brandGroupId].memberSet.add(memberId);
          this.createPersonAnalysisObj(memberId, memberName, _grouphName, _memGroupId);
          break;
      }

    });

    return memIdSet;
  }

  /**
   * 生成個人分析物件，方便後續計算個人分析數據
   * @param userId {number}
   * @param userName {string}
   * @param groupName {string}
   * @param groupId {string}
   * @author kidin-1100617
   */
   createPersonAnalysisObj(userId: number, userName: string, groupName: string, groupId: string) {
    if (this.memberList.analysisObj[userId]) {
      this.memberList.analysisObj[userId].belongGroup.push({
        name: groupName,
        groupId: groupId
      })
    } else {
      this.memberList.analysisObj = {
        [userId]: {
          openPrivacy: false,
          name: userName,
          belongGroup: [{
            name: groupName,
            groupId: groupId
          }]
        },
        ...this.memberList.analysisObj
      };

    }

  }

  /**
   * 取得目標群組成員數據
   * @author kidin-1100617
   */
   getMemberData(idList: Array<number>) {
    const { startTimestamp, endTimestamp } = this.reportConditionOpt.date,
          body = {
            token: this.utils.getToken(),
            type: this.reportTime.type,
            targetUserId: idList,
            filterStartTime: dayjs(startTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
            filterEndTime: dayjs(endTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
          };

    this.reportService.fetchTrackingSummaryArray(body).subscribe(res => {
      if (res.length && res.length > 0) {
        this.uiFlag.noData = false;
        this.changeProgress(70);
        this.createReport(res);
      } else {
        this.uiFlag.noData = true;
        this.changeProgress(100);
      }
      
    });

  }

  /**
   * 建立圖表用時間軸陣列，用來與數據之時間比對用
   * @param date {startTimestamp, endTimestamp}
   * @author kidin-1100419
   */
   createChartXaxis(
    date: {
      startTimestamp: number,
      endTimestamp: number
    },
    type: number
  ) {
    const { startTimestamp, endTimestamp } = date,
          result = [];
    let dateRange: number,
        reportStartDate = startTimestamp,
        reportEndDate = endTimestamp;
    if (type === 1) {
      this.dateLen = dayjs(endTimestamp).diff(dayjs(startTimestamp), 'day') + 1;
      dateRange = 86400000; // 間隔1天(ms)
    } else {
      reportStartDate = dayjs(startTimestamp).startOf('week').valueOf(),
      reportEndDate = dayjs(endTimestamp).startOf('week').valueOf();
      this.dateLen = dayjs(reportEndDate).diff(dayjs(reportStartDate), 'week') + 1;
      dateRange = 604800000;  // 間隔7天(ms)
    }

    for (let i = 0; i < this.dateLen; i++) {
      result.push(reportStartDate + dateRange * i);
    }

    return result;
  }

  /**
   * 統計數據以建立報告
   * @param data {Array<any>}-api 2107的數據
   * @author kidin-1100617
   */
  createReport(data: Array<any>) {
    const dataKey = this.reportTime.type === 1 ? 'reportLifeTrackingDays' : 'reportLifeTrackingWeeks',
          recordPeopleSet = new Set<number>();
    let haveData = false,
        mixData = [];
    data.forEach(_data => {
      const { resultCode, userId } = _data,
            lifeTracking = _data[dataKey];
      // 針對關閉隱私權的使用者建立對應物件
      if (resultCode !== 403) {
        this.personAnalysis[userId].openPrivacy = true;
        if (lifeTracking.length > 0) {
          haveData = true;
          mixData = mixData.concat(lifeTracking);
          recordPeopleSet.add(_data.userId); // 計算有效人數
          this.countPersonAnalysis(userId, lifeTracking);
        }

        if (lifeTracking.length !== 0) this.createRangeTrend(userId, lifeTracking);
      }

    });

    if (!haveData) {
      this.uiFlag.noData = true;
      this.changeProgress(100);
    } else {
      this.translate.get('hellow world').pipe(
        takeUntil(this.ngUnsubscribe)
      ).subscribe(() => {
        this.uiFlag.noData = false;
        const { date: {startTimestamp, endTimestamp} } = this.reportConditionOpt,
              rangeUnit = this.translate.instant('universal_time_day');
        this.reportTime = {
          create: dayjs().format('YYYY-MM-DD HH:mm'),
          endDate: dayjs(endTimestamp).format('YYYY-MM-DD'),
          range: `${dayjs(endTimestamp).diff(dayjs(startTimestamp), 'day') + 1}${rangeUnit}`,
          diffWeek: (dayjs(endTimestamp).diff(dayjs(startTimestamp), 'day') + 1) / 7,
          type: this.reportTime.type,
          typeTranslate: this.translate.instant(this.reportTime.type === 1 ? 'universal_time_day' : 'universal_time_week')
        };

        this.createbodyDiagram(this.personAnalysis);
        this.handleMixData(mixData);
        this.handleGroupAnalysis(this.personAnalysis);
        this.createAnalysisTable();
        this.changeProgress(100);
        this.updateUrl();
      });
      
    }

  }

  /**
   * 統計個人用分析數據
   * @param userId {number}-使用者id
   * @param data {any}-一位成員的數據
   * @param startTime {string}-該筆生活追蹤檔案時間
   * @author kidin-1100617
   */
   countPersonAnalysis(userId: number, data: any) {
    const needKey = this.getNeedKey();
    data.forEach(_data => {

      needKey.forEach(_key => {
        const value = +_data[_key];
        let currentUser = this.personAnalysis[userId];
        if (value !== undefined) {

          if (!this.getLatestKey().includes(_key)) {

            if (currentUser[_key] !== undefined) {
              currentUser[_key] += value;
              if (value !== 0) currentUser[`${_key}EffectCount`]++;
            } else {
              this.personAnalysis[userId] = {
                [_key]: value,
                [`${_key}EffectCount`]: value !== 0 ? 1 : 0,
                ...this.personAnalysis[userId]
              };

            }

          } else {
            // 部份數據只取最新的值，ex.體重
            const isValidValue = _key === 'gender' || value ? true : false;
            if (!currentUser[_key] && isValidValue) {
              this.personAnalysis[userId] = {
                [_key]: value,
                ...this.personAnalysis[userId]
              };
            }

          }

        }

      });

    });

    const { bodyHeight, bodyWeight, fatRate } = this.personAnalysis[userId];
    if (bodyHeight && bodyWeight && fatRate) {
      this.personAnalysis[userId] = {
        FFMI: this.reportService.countFFMI(bodyHeight, bodyWeight, fatRate),
        ...this.personAnalysis[userId]
      };
    }

  }

  /**
   * 建立區間趨勢
   * @param userId {number}
   * @param userData {any}
   * @author kidin-1100617
   */
   createRangeTrend(userId: number, userData: any) {
    let regressionObj = {
      timestampArr: []
    };
    userData.forEach(_tracking => {
      const {
        startTime,
        bodyHeight,
        bodyWeight,
        fatRate,
        muscleRate,
        restHeartRate,
        totalDistanceMeters,
        totalFitSecond,
        totalStep
      } = _tracking;
      const BMI = this.reportService.countBMI(bodyHeight, bodyWeight),
            FFMI = this.reportService.countFFMI(bodyHeight, bodyWeight, fatRate);

      const startTimestamp = dayjs(startTime).valueOf();
      regressionObj.timestampArr.push(startTimestamp);
      regressionObj = this.handleRegression(regressionObj, 'bodyWeight', bodyWeight, userId, startTimestamp);
      regressionObj = this.handleRegression(regressionObj, 'fatRate', fatRate, userId, startTimestamp);
      regressionObj = this.handleRegression(regressionObj, 'muscleRate', muscleRate, userId, startTimestamp);
      regressionObj = this.handleRegression(regressionObj, 'restHeartRate', restHeartRate, userId, startTimestamp);
      regressionObj = this.handleRegression(regressionObj, 'distance', totalDistanceMeters, userId, startTimestamp);
      regressionObj = this.handleRegression(regressionObj, 'totalFitSecond', totalFitSecond, userId, startTimestamp);
      regressionObj = this.handleRegression(regressionObj, 'totalStep', totalStep, userId, startTimestamp);
      regressionObj = this.handleRegression(regressionObj, 'BMI', BMI, userId, startTimestamp);
      regressionObj = this.handleRegression(regressionObj, 'FFMI', FFMI, userId, startTimestamp);
    });

    for (let _key in regressionObj) {
      if (regressionObj.hasOwnProperty(_key) && _key !== 'timestampArr') {
        const slope = new SimpleLinearRegression(regressionObj['timestampArr'], regressionObj[_key]).slope || 0;
        let trend: 'up' | 'down' = null;
        if (slope > 0) {
          trend = 'up';
        } else if (slope < 0) {
          trend = 'down';
        }

        this.personAnalysis[userId] = {
          [`${_key}Trend`]: trend,
          ...this.personAnalysis[userId]
        };

      }

    }

  }

  /**
   * 取得報告所需數據的key
   * @returns {Array<string>}-報告所需數據的key
   * @author kidin-1100617
   */
  getNeedKey(): Array<string> {
    return [
      'birthYear',
      'bodyHeight',
      'bodyWeight',
      'fatRate',
      'gender',
      'muscleRate',
      'restHeartRate',
      'targetStep',
      'totalDeepSecond',
      'totalDistanceMeters',
      'totalFitSecond',
      'totalLightSecond',
      'totalSleepSecond',
      'totalStandUpSecond',
      'totalStep'
    ];

  }

  /**
   * 取得分析列表中，只更新最新值的key
   * @author kidin-1100618
   */
  getLatestKey(): Array<string> {
    return [
      'gender',
      'restHeartRate',
      'birthYear',
      'bodyHeight',
      'bodyWeight',
      'fatRate',
      'muscleRate'
    ];

  }

  /**
   * 將所有成員數據進行排序與統計以生成概要數據與圖表
   * @param mix {Array<any>}-所有成員數據
   * @author kidin-1100617
   */
   handleMixData(mixData: Array<any>) {
    mixData.sort((a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf());
    const dateArr = this.createChartXaxis(this.reportConditionOpt.date, this.reportTime.type),
          noRepeatDateData = this.mergeSameDateData(mixData),
          needKey = this.getNeedKey();
    let dataIdx = 0;
    for (let i = 0, len = dateArr.length; i < len; i++) {
      // 若無該日數據，則以補0方式呈現圖表數據。
      const xAxisTimestamp = dateArr[i],
            { startTimestamp, tracking } = noRepeatDateData[dataIdx] || { startTimestamp: undefined, tracking: undefined };
      if (xAxisTimestamp === startTimestamp) {
        let sameDateData = {};
        const trackingLen = tracking.length;
        for (let j = 0; j < trackingLen; j++) {
          const _tracking = tracking[j];
          for (let k = 0, keyLen = needKey.length; k < keyLen; k++) {
            const key = needKey[k],
                  excludeKey = [
                    'birthYear',
                    'gender'
                  ];
            if (_tracking.hasOwnProperty(key) && !excludeKey.includes(key)) {
              let value: number;
              value = +_tracking[key];

              // 將各數據加總，之後均化產生趨勢圖表
              if (sameDateData[key] !== undefined) {
                sameDateData[key] += value;
              } else {
                sameDateData = {[key]: value, ...sameDateData};
              }

              // 計算紀錄數據非0的人數，以方便計算人均數據
              if (value) {
                const countKey = `${key}EffectCount`;
                if (sameDateData[countKey] !== undefined) {
                  sameDateData[countKey] ++;
                } else {
                  sameDateData = {[countKey]: 1, ...sameDateData};
                }

              }

            }

          }

        }

        this.createChartData(sameDateData, xAxisTimestamp);
        dataIdx++;
      } else {
        let zeroData = {};
        for (let l = 0, keyLen = needKey.length; l < keyLen; l++) {
          const key = needKey[l];
          zeroData = {[key]: 0, ...zeroData};
        }

        this.createChartData(zeroData, xAxisTimestamp);
      }

    }

    this.getTrendAvgValue();
  }

  /**
   * 製作各圖表所需數據
   * @param strokeData {any}-一個時間單位（日/週）加總的資料
   * @param startTimestamp {number}-該筆數據開始時間
   * @author kidin-1100617
   */
  createChartData(strokeData: any, startTimestamp: number) {
    this.createStepTrendChart(strokeData, startTimestamp);
    this.createSleepTrendChart(strokeData, startTimestamp);
    this.createBMITrendChart(strokeData, startTimestamp);
    this.createFatRateTrendChart(strokeData, startTimestamp);
    this.createMuscleRateTrendChart(strokeData, startTimestamp);
    this.cheateFitTimeTrendChart(strokeData, startTimestamp);
  }

  /**
   * 取得趨勢圖表所需平均值
   * @author kidin-1100617
   */
  getTrendAvgValue() {
    const { fitTimeTrend: { ttlSecond, haveDataLen } } = this.chart;
    if (haveDataLen > 0) {
      this.chart.fitTimeTrend.avgMin = parseFloat(((ttlSecond / 60) / haveDataLen).toFixed(0));
    }
    
  }

  /**
   * 統計團體用分析數據
   * @param personData {any}-個人分析數據
   * @param avgDataRecord {any}-個人平均數據分別所佔筆數
   * @author kidin-1100617
   */
  handleGroupAnalysis(personData: any) {
    this.groupAnalysis = this.utils.deepCopy(this.groupList.analysisObj);
    for (let gid in (this.groupAnalysis as any)) {
      if (this.groupAnalysis.hasOwnProperty(gid)) {
        const { memberSet, memberList } = this.groupAnalysis[gid],
              idList = Array.from(memberSet);
        idList.forEach(_idList => {
          const _id  = _idList as number;
          if (personData.hasOwnProperty(_id)) {
            const { name, openPrivacy, birthYear } = personData[_id];
            memberList.push({
              name,
              userId: _id,
              openPrivacy
            });

            if (openPrivacy && birthYear) {

              if (this.groupAnalysis[gid].recordPeople !== undefined) {
                this.groupAnalysis[gid].recordPeople ++;
              } else {
                this.groupAnalysis[gid] = {
                  recordPeople: 1,
                  ...this.groupAnalysis[gid]
                };

              }

              for (let key in personData[_id]) {
                const isEffectCountKey = key.toLowerCase().includes('effectcount'),
                      excludeKey = [
                        'name',
                        'gender',
                        'openPrivacy',
                        'restHeartRate',
                        'targetStep',
                        'totalDeepSecond',
                        'totalLightSecond',
                        'totalStandUpSecond',
                        'belongGroup'
                      ];
                if (!excludeKey.includes(key) && !isEffectCountKey) {
                  let addKey: string,
                      addValue: number;
                  switch (key) {
                    case 'birthYear':
                      // 統一使用1月1日當生日計算年齡
                      const birthday = `${personData[_id][key]}0101`;
                      addKey = 'age';
                      addValue = this.reportService.countAge(birthday);
                      break;
                    case 'totalSleepSecond':
                      addKey = 'totalSleepSecond';
                      addValue = (personData[_id][key] / personData[_id][`${addKey}EffectCount`]) || 0;
                      break;
                    default:
                      addKey = key;
                      addValue = personData[_id][key];
                      break;
                  }

                  // 數據加總
                  if (this.groupAnalysis[gid].hasOwnProperty(addKey)) {

                    if (addValue) {
                      this.groupAnalysis[gid][addKey] += addValue;
                      // 有效筆數(不為0的筆數)，計算平均數據用
                      if (this.groupAnalysis[gid][`${addKey}EffectCount`]) {
                        this.groupAnalysis[gid][`${addKey}EffectCount`]++;
                      } else {
                        this.groupAnalysis[gid] = {
                          [`${addKey}EffectCount`]: 1,
                          ...this.groupAnalysis[gid]
                        };

                      }

                    }

                  } else {
                    this.groupAnalysis[gid] = {
                      [addKey]: addValue,
                      ...this.groupAnalysis[gid]
                    };

                    if (addValue) {
                      this.groupAnalysis[gid] = {
                        [`${addKey}EffectCount`]: 1,
                        ...this.groupAnalysis[gid]
                      };

                    }

                  }

                }

              }

            }

          }

        });

        this.createGroupRegression(gid);
      }
      
    }

    const { selectGroup } = this.reportConditionOpt.group,
          currentGroupId = this.groupService.getCompleteGroupId(selectGroup.split('-'));
    this.info = this.groupAnalysis[currentGroupId];
  }

  /**
   * 建立群組區間趨勢
   * @param groupId {string}-群組id
   * @author kidin-1100617
   */
  createGroupRegression(groupId: string) {
    const regressionData = this.groupList.regression[groupId];
    for (let _dataType in regressionData) {
      if (regressionData.hasOwnProperty(_dataType)) {
        const { data, date } = regressionData[_dataType],
              slope = new SimpleLinearRegression(date, data).slope || 0;
        let trend: 'up' | 'down' = null;
        if (slope > 0) {
          trend = 'up';
        } else if (slope < 0) {
          trend = 'down';
        }

        Object.assign(this.groupAnalysis[groupId], {
          [`${_dataType}Trend`]: trend
        });

      }

    }

  }

  /**
   * 根據視窗寬度建立個人可設定的數據
   * @author kidin-1100617
   */
   createAnalysisTable() {
    this.groupTable.showDataDef = [
      'name',
      'memberNum',
      'totalStep',
      'totalFitTime',
      'avgSleep',
      'distance',
      'fatRate',
      'muscleRate'
    ];

    this.personTable.showDataDef = [
      'name',
      'totalStep',
      'totalFitTime',
      'avgSleep',
      'distance',
      'restHr',
      'BMI',
      'fatRate',
      'muscleRate',
      // 'FFMI',
      'bodyAssessment'
    ];

    this.setDisplayCol();
    this.groupTable.list.sort = this.groupSortTable;
    this.personTable.list.sort = this.personSortTable;
    this.groupTable.list.data = Object.keys(this.groupAnalysis).sort();
    this.personTable.list.data = Object.keys(this.personAnalysis);
  }

  /**
   * 判斷物件是否有該區間趨勢的類別，並將數據儲存
   * @param obj {any}-儲存區間趨勢數據用物件
   * @param key {string}-欲建立區間趨勢的類別
   * @param value {number | string}-欲建立區間趨勢的類別數據
   * @param userId {number}-成員id
   * @param timestamp {number}-該數據起始時間
   * @author kidin-1100526
   */
   handleRegression(obj: any, key: string, value: number | string, userId: number, timestamp: number) {
    const numValue = +value;
    if (obj.hasOwnProperty(key)) {
      obj[key].push(numValue);
    } else {
      obj = {
        [key]: [numValue],
        ...obj
      };
    }

    this.mergeGroupData(key, numValue, userId, timestamp);
    return obj;
  }

  /**
   * 將數據合併至所屬群組
   * @param key {string}-欲建立區間趨勢的類別
   * @param value {number}-欲建立區間趨勢的類別數據
   * @param userId {number}-成員所id
   * @param timestamp {number}-該數據起始時間
   * @author kidin-1100617
   */
   mergeGroupData(key: string, value: number, userId: number, timestamp: number) {
    const { analysisObj } = this.groupList;
    for (let _groupId in analysisObj) {

      if (analysisObj[_groupId].memberSet.has(userId)) {
        let _group = this.groupList.regression[_groupId];
        if (_group) {
          const _regressionEle = _group[key];
          if (_regressionEle) {
            _regressionEle.data.push(value);
            _regressionEle.date.push(timestamp);
          } else {
            this.groupList.regression[_groupId] = {
              [key]: {
                data: [value],
                date: [timestamp]
              },
              ...this.groupList.regression[_groupId]
            }
  
          }
  
        } else {
          this.groupList.regression = {
            [_groupId]: {
              [key]: {
                data: [value],
                date: [timestamp]
              } 
            },
            ...this.groupList.regression
          }
  
        }

      }

    }

  }

  /**
   * 根據視窗寬度預設可顯示的欄位(含名稱)
   * @author kidin-1100617
   */
   setDisplayCol() {
    const { max } = this.tableColumn,
          opt = JSON.parse(this.utils.getLocalStorageObject('groupLifeTrackingReport'));
    if (opt) {
      const { group, person } = opt;
      if (group.length > max) {
        group.length = max;
        this.saveAnalysisOpt(opt);
      }

      if (person.length > max) {
        person.length = max;
        this.saveAnalysisOpt(opt);
      }

      this.groupTableOpt = group;
      this.personTableOpt = person;
    } else {
      this.setDefaultGroupCol(max);
      this.setDefaultPersonCol(max);
      this.saveAnalysisOpt(opt);
    }

  }

  /**
   * 根據可顯示的欄位數目，設定群組分析顯示欄位
   * @param len {number}-可顯示的欄位數目
   * @author kidin-1100617
   */
   setDefaultGroupCol(len: number) {
    this.groupTableOpt = [
      'name',
      'memberNum',
      'totalStep',
      'totalFitTime',
      'fatRate',
      'muscleRate'
    ];

    this.groupTableOpt.length = len;
  }

  /**
   * 根據可顯示的欄位數目，設定個人分析顯示欄位
   * @param len {number}-可顯示的欄位數目
   * @author kidin-1100617
   */
   setDefaultPersonCol(len: number) {
    this.personTableOpt = [
      'name',
      'totalStep',
      'BMI',
      'fatRate',
      'muscleRate',
      'bodyAssessment'
    ];

    this.personTableOpt.length = len;
  }

  /**
   * 儲存分析設定
   * @param opt {{group: Array<string>; person: Array<string>}}
   * @author kidin-1100617
   */
   saveAnalysisOpt(opt: {group: Array<string>; person: Array<string>}) {
    const optStr = JSON.stringify(opt);
    this.utils.setLocalStorageObject('groupLifeTrackingReport', optStr);
  }

  /**
   * 將同一天的數據合併（時區不同的數據以同年同月同日合併為同一天）
   * @param data {Array<any>}
   * @author kidin-1100419
   */
   mergeSameDateData(data: Array<any>) {
    let sameDateData = {};
    const result = [];
    for (let i = 0, len = data.length; i < len; i++) {
      const { startTime, ...rest } = data[i],
            { startTime: nextStartTime } = data[i + 1] || { startTime: undefined },
            startDate = startTime.split('T')[0],
            nextStartDate = nextStartTime ? nextStartTime.split('T')[0] : undefined;
      if (nextStartDate === startDate) {

        if (!sameDateData['startTimestamp']) {
          sameDateData = {
            startTimestamp: dayjs(startDate, 'YYYY-MM-DD').valueOf(),
            tracking: [rest]
          };
        } else {
          sameDateData['tracking'] = sameDateData['tracking'].concat([rest]);
        }

      } else {

        if (!sameDateData['startTimestamp']) {
          result.push({
            startTimestamp: dayjs(startDate, 'YYYY-MM-DD').valueOf(),
            tracking: [rest]
          });
        } else {
          sameDateData['tracking'] = sameDateData['tracking'].concat([rest]);
          result.push(sameDateData);
          sameDateData = {};
        }
        
      }

    }

    return result;
  }

  /**
   * 建立步數趨勢圖數據
   * @param strokeData {any}-一個時間單位（日/週）加總的資料
   * @param startTimestamp {number}-開始時間timestamp
   * @author kidin-1100621
   */
  createStepTrendChart(strokeData: any, startTimestamp: number) {
    const { totalStep, targetStep, totalDistanceMeters } = strokeData,
          { stepTrend } = this.chart;
    stepTrend.totalDistance += totalDistanceMeters;
    stepTrend.totalStep += totalStep;
    if (targetStep) {
      if (totalStep >= targetStep) {
        stepTrend.reachTimes ++;
        stepTrend.trendData.push({
            x: startTimestamp,
            y: totalStep,
            z: totalStep,  // tooltip數據用
            t: targetStep,  // tooltip數據用
            color: stepColor.reach
        });
      } else {
        const discolorPoint = totalStep / targetStep;
        stepTrend.trendData.push({
          x: startTimestamp,
          y: targetStep,
          z: totalStep,  // tooltip數據用
          t: targetStep,  // tooltip數據用
          color: {
            linearGradient: {
              x1: 0,
              x2: 0,
              y1: 1,
              y2: 0
            },
            stops: [
              [0, stepColor.step],
              [discolorPoint, stepColor.step],
              [discolorPoint + 0.01, stepColor.target],
              [1, stepColor.target]
            ]
          }

        });

      }

    } else {
      stepTrend.trendData.push({
        x: startTimestamp,
        y: 0,
        z: 0,  // tooltip數據用
        t: 0,  // tooltip數據用
      });

    }

  }

  /**
   * 建立睡眠趨勢圖
   * @param strokeData {any}-一個時間單位（日/週）加總的資料
   * @param startTimestamp {number}-起始日期timestamp
   * @author kidin-1100622
   */
  createSleepTrendChart(strokeData: any, startTimestamp: number) {
    const { 
      totalSleepSecond,
      totalSleepSecondEffectCount,
      totalDeepSecond,
      totalDeepSecondEffectCount,
      totalLightSecond,
      totalLightSecondEffectCount,
      totalStandUpSecond,
      totalStandUpSecondEffectCount
     } = strokeData;
    const { sleepTrend } = this.chart;
    if (totalSleepSecondEffectCount) {
      const avgSleepSecond = totalSleepSecond / totalSleepSecondEffectCount,
            avgDeepSleepSecond = (totalDeepSecond / totalDeepSecondEffectCount) || 0,
            avgLightSleepSecond = (totalLightSecond / totalLightSecondEffectCount) || 0;
      let avgStandUpSecond: number;
      // 裝置清醒時間較晚上線，故無清醒時間時，使用總睡眠時間減去深面與淺眠時間
      if (totalStandUpSecondEffectCount) {
        avgStandUpSecond = totalStandUpSecond / totalStandUpSecondEffectCount;
      } else {
        const ttlStandUpSecond = totalSleepSecond - totalDeepSecond - totalLightSecond;
        avgStandUpSecond = ttlStandUpSecond / totalSleepSecondEffectCount;
      }
            
      sleepTrend.dataLen++;
      sleepTrend.ttlAvgSleepSecond += avgSleepSecond;
      sleepTrend.ttlAvgDeepSleepSecond += avgDeepSleepSecond;
      sleepTrend.ttlAvgLightSleepSecond += avgLightSleepSecond;
      sleepTrend.trendData.deep.push([startTimestamp, avgDeepSleepSecond]);
      sleepTrend.trendData.light.push([startTimestamp, avgLightSleepSecond]);
      sleepTrend.trendData.standUp.push([startTimestamp, avgStandUpSecond]);
    } else {
      sleepTrend.trendData.deep.push([startTimestamp, 0]);
      sleepTrend.trendData.light.push([startTimestamp, 0]);
      sleepTrend.trendData.standUp.push([startTimestamp, 0]);
    }

  }

  /**
   * 建立體態分佈圖
   * @param personData {any}-個人分析數據
   * @author kidin-1100622
   */
  createbodyDiagram(personData: any) {
    for (let key in personData) {

      if (personData.hasOwnProperty(key)) {
        const userData = personData[key],
              { FFMI, gender, fatRate } = userData;
        if (FFMI && fatRate) {
          this.chart.bodyDiagram.push({
            FFMI,
            fatRate,
            gender
          });

        }
        
      }

    }

  }

  /**
   * 建立BMI趨勢圖
   * @param strokeData {any}-一個時間單位（日/週）加總的資料
   * @param startTimestamp {number}-起始日期timestamp
   * @author kidin-1100622
   */
  createBMITrendChart(strokeData: any, startTimestamp: number) {
    const { bodyHeight, bodyWeight, bodyWeightEffectCount, bodyHeightEffectCount } = strokeData,
          { BMITrend } = this.chart,
          { arr } = BMITrend.data,
          currentDataLen = arr.length;
    if (bodyWeightEffectCount && bodyHeightEffectCount) {
      const weight = parseFloat((bodyWeight / bodyWeightEffectCount).toFixed(1)),
            height = parseFloat((bodyHeight / bodyHeightEffectCount).toFixed(1)),
            BMI = this.reportService.countBMI(height, weight);
      BMITrend.noData = false;
      // 將前面為0的數據用後面的值補值
      if (BMITrend.zeroDataBefore) {
        if (currentDataLen !== 0) BMITrend.data.arr = BMITrend.data.arr.map(_data => [_data[0], BMI]);
        BMITrend.zeroDataBefore = false;
      }

      BMITrend.data.arr.push([startTimestamp, BMI]);
      // 取得圖表上下界
      const { top, bottom } = BMITrend.data;
      if (BMI > top) {
        BMITrend.data.top = BMI;
      }

      if (!bottom || BMI < bottom) {
        BMITrend.data.bottom = BMI;
      }

    } else {
      // 使用前面數值補值
      if (BMITrend.zeroDataBefore || currentDataLen === 0) {
        BMITrend.data.arr.push([startTimestamp, 0]);
      } else {
        const beforeValue = arr[currentDataLen - 1][1];
        BMITrend.data.arr.push([startTimestamp, beforeValue]);
      }
      
    }

  }

  /**
   * 建立體脂率趨勢圖
   * @param strokeData {any}-一個時間單位（日/週）加總的資料
   * @param startTimestamp {number}-起始日期timestamp
   * @author kidin-1100622
   */
  createFatRateTrendChart(strokeData: any, startTimestamp: number) {
    const { fatRate, fatRateEffectCount } = strokeData,
          { fatRateTrend } = this.chart,
          { arr } = fatRateTrend.data,
          currentDataLen = arr.length;
    if (fatRateEffectCount) {
      const avgFatRate = parseFloat((fatRate / fatRateEffectCount).toFixed(1));
      fatRateTrend.noData = false;
      // 將前面為0的數據用後面的值補值
      if (fatRateTrend.zeroDataBefore) {
        if (currentDataLen !== 0) fatRateTrend.data.arr = fatRateTrend.data.arr.map(_data => [_data[0], avgFatRate]);
        fatRateTrend.zeroDataBefore = false;
      }

      fatRateTrend.data.arr.push([startTimestamp, avgFatRate]);
      // 取得圖表上下界
      const { top, bottom } = fatRateTrend.data;
      if (avgFatRate > top) {
        fatRateTrend.data.top = avgFatRate;
      }

      if (!bottom || avgFatRate < bottom) {
        fatRateTrend.data.bottom = avgFatRate;
      }

    } else {
      // 使用前面數值補值
      if (fatRateTrend.zeroDataBefore || currentDataLen === 0) {
        fatRateTrend.data.arr.push([startTimestamp, 0]);
      } else {
        const beforeValue = arr[arr.length - 1][1];
        fatRateTrend.data.arr.push([startTimestamp, beforeValue]);
      }

    }


  }

  /**
   * 建立肌肉率趨勢圖
   * @param strokeData {any}-一個時間單位（日/週）加總的資料
   * @param startTimestamp {number}-起始日期timestamp
   * @author kidin-1100622
   */
  createMuscleRateTrendChart(strokeData: any, startTimestamp: number) {
    const { muscleRate, muscleRateEffectCount } = strokeData,
          { muscleRateTrend } = this.chart,
          { arr } = muscleRateTrend.data,
          currentDataLen = arr.length;
    if (muscleRate) {
      const avgMuscleRate = parseFloat((muscleRate / muscleRateEffectCount).toFixed(1));
      muscleRateTrend.noData = false;
      // 將前面為0的數據用後面的值補值
      if (muscleRateTrend.zeroDataBefore) {
        if (currentDataLen !== 0) muscleRateTrend.data.arr = muscleRateTrend.data.arr.map(_data => [_data[0], avgMuscleRate]);
        muscleRateTrend.zeroDataBefore = false;
      }

      muscleRateTrend.data.arr.push([startTimestamp, avgMuscleRate]);
      // 取得圖表上下界
      const { top, bottom } = muscleRateTrend.data;
      if (avgMuscleRate > top) {
        muscleRateTrend.data.top = avgMuscleRate;
      }

      if (!bottom || avgMuscleRate < bottom) {
        muscleRateTrend.data.bottom = avgMuscleRate;
      }

    } else {
      // 使用前面數值補值
      if (muscleRateTrend.zeroDataBefore || currentDataLen === 0) {
        muscleRateTrend.data.arr.push([startTimestamp, 0]);
      } else {
        const beforeValue = arr[arr.length - 1][1];
        muscleRateTrend.data.arr.push([startTimestamp, beforeValue]);
      }

    }


  }

  /**
   * 建立燃脂時間趨勢圖
   * @param strokeData {any}-一個時間單位（日/週）加總的資料
   * @param startTimestamp {number}-起始日期timestamp
   * @author kidin-1100622
   */
  cheateFitTimeTrendChart(strokeData: any, startTimestamp: number) {
    const { totalFitSecond, totalFitSecondEffectCount } = strokeData,
          ttlFitMin = parseFloat((totalFitSecond / 60).toFixed(0)),
          { fitTimeTrend } = this.chart;
    if (totalFitSecondEffectCount) {
      fitTimeTrend.haveDataLen++;
      fitTimeTrend.ttlSecond += totalFitSecond;
      fitTimeTrend.dataArr.push([startTimestamp, ttlFitMin]);
      if (ttlFitMin > fitTimeTrend.maxMin) {
        fitTimeTrend.maxMin = ttlFitMin;
      }

    } else {
      fitTimeTrend.dataArr.push([startTimestamp, 0]);
    }

  }

  /**
   * 點擊分析設定紐
   * @param e {MouseEvent}
   * @param obj {SettingObj}-分析列表類別
   * @author kidin-1100617
   */
   handleShowOpt(e: MouseEvent, obj: SettingObj) {
    e.stopPropagation();  // 避免和訂閱的事件衝突
    if (this[`${obj}Table`].showOpt) {
      this.closeAllMenu();
    } else {
      this.closeAllMenu();
      this[`${obj}Table`].showOpt = true;
      this.subscribeScrollAndClick();
    }

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 關閉所有浮動選單
   * @author kidin-1100617
   */
  closeAllMenu() {
    this.groupTable.showOpt = false;
    this.personTable.showOpt = false;
    this.initAnalysisMenu();
    this.unsubscribeEvent();
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 初始化分析列表之聚焦選單（關閉選單）
   * @author kidin-1100617
   */
  initAnalysisMenu() {
    this.analysisMenu = {
      type: null,
      focusId: null,
      x: null,
      y: null
    };

  }

  /**
   * 訂閱捲動和點擊事件
   * @author kidin-1100617
   */
  subscribeScrollAndClick() {
    const scrollEle = document.querySelectorAll('.main-body'),
          scrollEvent = fromEvent(scrollEle, 'scroll'),
          clickEvent = fromEvent(window, 'click'),
          mergeEvent = merge(scrollEvent, clickEvent);

    this.scrollAndClickEvent = mergeEvent.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(event => {
      this.closeAllMenu();
    });

  }

  /**
   * 變更欄位設定
   * @param e {MatCheckboxChange}
   * @param type {SettingObj}-分析列表類別
   * @author kidin-1100617
   */
  changeTableOpt(e: MatCheckboxChange, type: SettingObj) {
    const { checked, source: { value } } = e;
    if (!checked) {
      this[`${type}TableOpt`] = this[`${type}TableOpt`].filter(_opt => _opt !== value);
    } else {
      this[`${type}TableOpt`].push(value);
    }

    const opt = {
            group: this.groupTableOpt,
            person: this.personTableOpt
          };
    this.saveAnalysisOpt(opt);
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 取消訂閱捲動和點擊事件
   * @author kidin-1100617
   */
  unsubscribeEvent() {
    this.scrollAndClickEvent.unsubscribe();
  }

  /**
   * 將群組或個人分析數據進行排序
   * @param type {SettingObj}-群組或個人分析
   * @author kidin-1100317
   */
   arrangeData(type: SettingObj) {
    this[`${type}Table`].sorted = true;
    const sortCategory = this[`${type}SortTable`].active,
          sortDirection = this[`${type}SortTable`].direction;
    this[`${type}Table`].sortType = sortCategory;
    this.sortData(type, this[`${type}Table`].list.data, sortCategory, sortDirection === 'asc');
    this.changeDetectorRef.markForCheck();
  }
  
  /**
   * 依使用者點選的類別取得對應的數據
   * @param type {SettingObj}
   * @param id {string}-id
   * @param table {string}-欲排序的列表
   * @return Array<string>-排序依據
   * @return number
   * @author kidin-1100317
   */
  getSortData(type: SettingObj, id: string, col: string): number {
    const dataSource = this[`${type}Analysis`][id],
          {
            name,
            recordPeople,
            totalStep,
            totalFitSecond,
            totalSleepSecond,
            totalDistanceMeters,
            restHeartRate,
            bodyHeight,
            bodyWeight,
            fatRate,
            muscleRate
          } = dataSource;
    const denominator = type === 'group' ? dataSource.recordPeople : 1;
    switch (col) {
      case 'name':
        return name;
      case 'memberNum':
        return recordPeople;
      case 'totalStep':
        return (totalStep / denominator) || undefined;
      case 'totalFitTime':
        return (totalFitSecond / denominator) || undefined;
      case 'avgSleep':
        return (totalSleepSecond / denominator) || undefined;
      case 'distance':
        return (totalDistanceMeters / denominator) || undefined;
      case 'restHr':
        return (restHeartRate / denominator) || undefined;
      case 'BMI':
        if (bodyHeight && bodyWeight) {
          return (this.reportService.countBMI(bodyHeight, bodyWeight) / denominator);
        } else {
          return undefined;
        }
      case 'fatRate':
        return (fatRate / denominator) || undefined;
      case 'muscleRate':
        return (muscleRate / denominator) || undefined;
      case 'FFMI':
        if (bodyHeight && bodyWeight && fatRate) {
          return this.reportService.countFFMI(bodyHeight, bodyWeight, fatRate) / denominator;
        } else {
          return undefined;
        }
        
    }

  }
  
  /**
   * 將數據進行排序
   * @param type {SettingObj}
   * @param data {Array<any>}
   * @param sortCategory {string}-排序依據
   * @param asc {boolean}-是否升冪
   * @author kidin-1100317
   */
  sortData(type: SettingObj, data: Array<any>, sortCategory: string, asc: boolean) {
    let sortDenominator = 0,
        swaped = true,
        [...sortData] = data;
    for (let i = 0, len = sortData.length; i < len && swaped; i++) {
      swaped = false;
      for (let j = 0; j < len - 1 - i; j++) {
        let _dataA = this.getSortData(type, sortData[j], sortCategory),
            _dataB = this.getSortData(type, sortData[j + 1], sortCategory);
        // 排序時一併找出最大值
        if (_dataA > sortDenominator) {
          sortDenominator = _dataA;
        } else if (_dataB > sortDenominator) {
          sortDenominator = _dataB;
        }

        const noDataCond = _dataA === undefined && _dataB !== undefined,
              ascCond = _dataB !== undefined && asc && _dataB < _dataA,
              descCond = _dataB !== undefined && !asc && _dataB > _dataA;
        // 無紀錄者皆必排最後
        if (noDataCond || ascCond || descCond) {
          swaped = true;
          [sortData[j], sortData[j + 1]] = [sortData[j + 1], sortData[j]];
        }

      }

    }

    this[`${type}Table`].list.data = sortData;
    const showRatioKey = [
      'totalStep',
      'totalFitTime',
      'distance'
    ];
    if (showRatioKey.includes(sortCategory)) {
      sortData.map(_data => {
        const sortItemData = this.getSortData(type, _data, sortCategory);
        let numerator: number;
        if (sortItemData) {
          numerator = +sortItemData.toFixed(0);
        } else {
          numerator = 0;
        }

        let ratio: string;
        if (sortDenominator !== 0) {
          ratio = `${parseFloat(((numerator / sortDenominator) * 100).toFixed(0))}%`;
        } else {
          ratio = '0%';
        }
        
        Object.assign(this[`${type}Analysis`][_data], { ratio });
      });

    }
  }

  /**
   * 顯示指定對象選單
   * @param e {MouseEvent}
   * @param type {SettingObj}-分析列表類別
   * @param id {string}-群組或使用者id
   * @author kidin-1100524
   */
   showAnalysisInfoMenu(e: MouseEvent, type: SettingObj, id: string) {
    e.stopPropagation();
    this.closeAllMenu();
    this.subscribeScrollAndClick();
    const menuPosition = {
      x: `${e.clientX}px`,
      y: `${e.clientY}px`
    };

    // 點選位置太靠右則將選單往左移。
    if (e.view.innerWidth - e.clientX < 270) {
      menuPosition.x = `${e.view.innerWidth - 270}px`;
    }

    // 點選位置太靠下則將選單往上移。
    if (e.view.innerHeight - e.clientY < 280) {
      menuPosition.y = `${e.view.innerHeight - 280}px`;
    }

    this.analysisMenu = {
      type,
      focusId: id,
      x: menuPosition.x,
      y: menuPosition.y
    };

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 根據使用者點擊項目，新開項目視窗
   * @param obj {SettingObj}-項目類別
   * @param id {string}-群組或成員id
   * @author kidin-1100524
   */
  goPage(obj: SettingObj, id: string) {
    let url: string,
        hashId: string;
    if (obj === 'group') {
      hashId = this.hashIdService.handleGroupIdEncode(id);
      url = `/dashboard/group-info/${hashId}`;
    } else {
      hashId = this.hashIdService.handleUserIdEncode(id);
      url = `/user-profile/${hashId}`;
    }

    window.open(url);
  }

  /**
   * 該分析列表顯示所有人員
   * @param type {SettingObj}-分析列表類別
   * @author kidin-1100519
   */
   showAllData(type: SettingObj) {
    this[`${type}Table`].showAll = true;
    this.updateUrl();
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 更新預覽列印url
   * @author kidin-1100617
   */
  updateUrl() {
    const { date: {startTimestamp, endTimestamp} } = this.reportConditionOpt,
          { id } = this.groupInfo,
          { origin } = location,
          hashGroupId = this.hashIdService.handleGroupIdEncode(id),
          startDate = dayjs(startTimestamp).format('YYYY-MM-DD'),
          endDate = dayjs(endTimestamp).format('YYYY-MM-DD');
    let seeMore = '';
    if (this.groupTable.showAll) seeMore += 'g';
    if (this.personTable.showAll) seeMore += 'p';
    this.previewUrl = `${origin
      }/dashboard/group-info/${hashGroupId
      }/life-tracking?startdate=${startDate
      }&enddate=${endDate
      }&seemore=${seeMore
      }&ipm=s
    `;
  }

  /**
   * 列印
   */
  print() {
    window.print();
  }

  /**
   * 變更載入頁面進度，並檢查頁面渲染（避免loading bar出不來）
   * @author kidin-1100624
   */
  changeProgress(progress: number) {
    this.uiFlag.progress = progress;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 解除rxjs訂閱
   * @author kidin-1091211
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
