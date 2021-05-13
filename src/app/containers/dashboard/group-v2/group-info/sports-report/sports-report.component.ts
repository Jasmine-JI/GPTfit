import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { GroupService } from '../../../services/group.service';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { ReportService } from '../../../../../shared/services/report.service';
import { ReportConditionOpt } from '../../../../../shared/models/report-condition';
import { Subject, of, combineLatest } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { HashIdService } from '../../../../../shared/services/hash-id.service';
import { MatSort, Sort } from '@angular/material/sort';
import moment from 'moment';
import { MatTableDataSource } from '@angular/material/table';
import SimpleLinearRegression from 'ml-regression-simple-linear';
import { GroupDetailInfo } from '../../../models/group-detail';
import { GroupTree, SportType, SportCode } from '../../../../../shared/models/report-condition';
import {
  commonData,
  runData,
  rideData,
  weightTrainData,
  swimData,
  rowData,
  ballData
} from '../../../../../shared/models/sports-report';
import { Unit, mi, unit } from '../../../../../shared/models/bs-constant';
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
import { GroupLevel } from '../../../../dashboard/models/group-detail';
import { MuscleCode, MuscleGroup } from '../../../../../shared/models/weight-train';


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

  /**
   * UI控制相關flag
   */
   uiFlag = {
    isPreviewMode: false,
    progress: 100,
    noData: true,
    inited: false,
    analysisType: SportCode.all,
    noFtpData: true
  }

  /**
   * 報告頁面可讓使用者篩選的條件
   */
  reportConditionOpt: ReportConditionOpt = {
    brandType: 2,
    reportType: 'sport',
    date: {
      startTimestamp: moment().startOf('day').subtract(6, 'days').valueOf(),
      endTimestamp: moment().endOf('day').valueOf(),
      type: 'sevenDay'
    },
    group: {
      brands: null,
      branches: null,
      coaches: [],
      selectGroup: null
    },
    sportType: SportCode.all,
    hideConfirmBtn: false
  }

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

  info = {};  // 報告概要資訊

  /**
   * 圖表用數據
   */
  chart = {
    ring: {
      stroke: [0, 0, 0, 0, 0, 0, 0],
      time: [0, 0, 0, 0, 0, 0, 0]
    },
    distribution: {
      typeList: [],
      perAvgHR: [],
      perActivityTime: []
    },
    strokeTrend: <FilletTrendChart>{
      maxStrokeNum: 0,
      avgStrokeNum: 0,
      strokeNum: [],
      colorSet: strokeNumColor
    },
    totalTimeTrend: <FilletTrendChart>{
      maxTotalTime: 0,
      avgTotalTime: 0,
      totalTime: [],
      colorSet: costTimeColor
    },
    caloriesTrend: <FilletTrendChart>{
      maxCalories: 0,
      avgCalories: 0,
      calories: [],
      colorSet: caloriesColor
    },
    hrTrend: <CompareLineTrendChart>{
      hrArr: [],
      maxHrArr: [],
      avgHr: 0,
      maxHr: 0
    },
    distanceTrend: <FilletTrendChart>{
      maxDistance: 0,
      avgDistance: 0,
      distance: [],
      colorSet: distanceColor
    },
    powerTrend: <CompareLineTrendChart>{
      powerArr: [],
      maxPowerArr: [],
      avgPower: 0,
      maxPower: 0
    },
    speedPaceTrend: <DiscolorTrendData>{
      dataArr: [],
      avgSpeed: 0,
      maxSpeed: 0,
      minSpeed: null
    },
    cadenceTrend: <DiscolorTrendData> {
      dataArr: [],
      avgCadence: 0,
      maxCadence: 0,
      minCadence: null
    },
    swolfTrend: <DiscolorTrendData> {
      dataArr: [],
      avgSwolf: 0,
      maxSwolf: 0,
      minSwolf: null
    },
    totalXAxisMoveTrend: <RelativeTrendChart>{
      positiveData: [],
      negativeData: [],
      maxGForce: 0,
      minGForce: 0
    },
    totalYAxisMoveTrend: <RelativeTrendChart>{
      positiveData: [],
      negativeData: [],
      maxGForce: 0,
      minGForce: 0
    },
    totalZAxisMoveTrend: <RelativeTrendChart>{
      positiveData: [],
      negativeData: [],
      maxGForce: 0,
      minGForce: 0
    },
    extremeXGForce: <CompareLineTrendChart>{
      maxXArr: [],
      minXArr: [],
      maxX: 0,
      minX: 0
    },
    extremeYGForce: <CompareLineTrendChart>{
      maxYArr: [],
      minYArr: [],
      maxY: 0,
      minY: 0
    },
    extremeZGForce: <CompareLineTrendChart>{
      maxZArr: [],
      minZArr: [],
      maxZ: 0,
      minZ: 0
    },
    hrzone: [0, 0, 0, 0, 0, 0],
    hrInfo: {
      hrBase: 0,
      z0: 'Z0',
      z1: 'Z1',
      z2: 'Z2',
      z3: 'Z3',
      z4: 'Z4',
      z5: 'Z5'
    },
    hrZoneTrend: {
      zoneZero: [],
      zoneOne: [],
      zoneTwo: [],
      zoneThree: [],
      zoneFour: [],
      zoneFive: []
    },
    thresholdZone: [0, 0, 0, 0, 0, 0, 0],
    thresholdZoneTrend: {
      zoneZero: [],
      zoneOne: [],
      zoneTwo: [],
      zoneThree: [],
      zoneFour: [],
      zoneFive: [],
      zoneSix: []
    }

  };

  /**
   * 用來計算趨勢圖表日平均/週平均
   */
  totalCount = {
    stroke: 0,
    totalTime: 0,
    calories: 0,
    distance: 0,
    hr: 0,
    power: 0,
    speed: 0,
    cadence: 0,
    swolf: 0
  };

  groupAnalysis = {};  // 群組分析
  personAnalysis = {};  // 個人分析

  groupTable = {
    showAll: false
  }

  memberTable = {
    showAll: false
  }

  /**
   * 頁面所需相關時間日期資訊
   */
  reportTime = {
    endDate: null,
    range: null,
    create: null,
    type: <1 | 2>1 // 1: 日報告 2: 週報告
  };

  userId: number;
  unit = <Unit>unit.metric;  // 使用者所使用的單位
  previewGroupId = null;  // 預覽列印所選之群組
  dateLen = 0; // 報告橫跨天數/週數
  haveDataLen = 0;  // 有數據的天（週）數
  sameTimeGroupData: any;
  groupList: any;
  memberList = {
    analysisObj: {},
    noRepeatList: []
  };
  previewUrl: string;
  windowWidth = 320;  // 視窗寬度
  mi = mi;
  sportCode = SportCode;
  groupLevelEnum = GroupLevel;

  constructor(
    private utils: UtilsService,
    private reportService: ReportService,
    private groupService: GroupService,
    private hashIdService: HashIdService,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private userProfileService: UserProfileService
  ) { }

  ngOnInit(): void {
    this.checkQueryString(location.search);
    this.getNeedInfo();
  }

  /**
   * 從query string取得參數
   * @param queryString {string}
   * @author kidin-1100414
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
            this.reportConditionOpt.date.startTimestamp = moment(_value, 'YYYY-MM-DD').startOf('day').valueOf();
            break;
          case 'enddate':
            this.reportConditionOpt.date.endTimestamp = moment(_value, 'YYYY-MM-DD').endOf('day').valueOf();
            break;
          case 'group':
            this.previewGroupId = this.hashIdService.handleGroupIdDecode(_value);
            break;
          case 'sportType':
            this.reportConditionOpt.sportType = +_value as SportType;
            break;
          case 'seemore':
            if (_value.includes('g')) this.groupTable.showAll = true;
            if (_value.includes('m')) this.memberTable.showAll = true;
            break;
        }

      });

    }

  }

  /**
   * 取得目前所在群組與其他群組階層資訊
   * @author kidin-1091028
   */
  getNeedInfo() {
    combineLatest([
      this.groupService.getAllLevelGroupData(),
      this.userProfileService.getRxUserProfile()
    ]).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(resArr => {
console.log('allGroup', resArr);
      this.groupList = resArr[0];
      const { groupId, brands, branches, coaches } = resArr[0] as any,
            { userId, unit, heartRateBase } = resArr[1] as any,
            groupLevel = this.utils.displayGroupLevel(groupId),
            group = this.reportConditionOpt.group;

      this.userId = userId;
      this.unit = unit;
      this.chart.hrInfo.hrBase = heartRateBase;
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

      if (this.uiFlag.isPreviewMode) {
        const previewGroupLevel = this.utils.displayGroupLevel(this.previewGroupId);
        if (previewGroupLevel !== groupLevel) {
          
          switch (previewGroupLevel) {
            case GroupLevel.branch:
              group.selectGroup = this.previewGroupId.split('-').slice(0, 4).join('-');
              break;
            case GroupLevel.class:
              group.selectGroup = this.previewGroupId.split('-').slice(0, 5).join('-');
              break;
          }

        }

      }

      this.reportService.setReportCondition(this.reportConditionOpt);
      this.getReportSelectedCondition();
    });

  }

  /**
   * 初始化報告
   * @author kidin-1100414
   */
  initReportContent() {
    this.info = {};
    this.chart = {
      ring: {
        stroke: [0, 0, 0, 0, 0, 0, 0],
        time: [0, 0, 0, 0, 0, 0, 0]
      },
      distribution: {
        typeList: [],
        perAvgHR: [],
        perActivityTime: []
      },
      strokeTrend: {
        maxStrokeNum: 0,
        avgStrokeNum: 0,
        strokeNum: [],
        colorSet: strokeNumColor
      },
      totalTimeTrend: {
        maxTotalTime: 0,
        avgTotalTime: 0,
        totalTime: [],
        colorSet: costTimeColor
      },
      caloriesTrend: {
        maxCalories: 0,
        avgCalories: 0,
        calories: [],
        colorSet: caloriesColor
      },
      hrTrend: {
        hrArr: [],
        maxHrArr: [],
        avgHr: 0,
        maxHr: 0
      },
      distanceTrend: {
        maxDistance: 0,
        avgDistance: 0,
        distance: [],
        colorSet: distanceColor
      },
      powerTrend: {
        powerArr: [],
        maxPowerArr: [],
        avgPower: 0,
        maxPower: 0
      },
      speedPaceTrend: {
        dataArr: [],
        avgSpeed: 0,
        maxSpeed: 0,
        minSpeed: null
      },
      cadenceTrend: {
        dataArr: [],
        avgCadence: 0,
        maxCadence: 0,
        minCadence: null
      },
      swolfTrend: {
        dataArr: [],
        avgSwolf: 0,
        maxSwolf: 0,
        minSwolf: null
      },
      totalXAxisMoveTrend: {
        positiveData: [],
        negativeData: [],
        maxGForce: 0,
        minGForce: 0
      },
      totalYAxisMoveTrend: {
        positiveData: [],
        negativeData: [],
        maxGForce: 0,
        minGForce: 0
      },
      totalZAxisMoveTrend: {
        positiveData: [],
        negativeData: [],
        maxGForce: 0,
        minGForce: 0
      },
      extremeXGForce: {
        maxXArr: [],
        minXArr: [],
        maxX: 0,
        minX: 0
      },
      extremeYGForce: {
        maxYArr: [],
        minYArr: [],
        maxY: 0,
        minY: 0
      },
      extremeZGForce: {
        maxZArr: [],
        minZArr: [],
        maxZ: 0,
        minZ: 0
      },
      hrzone: [0, 0, 0, 0, 0, 0,],
      hrInfo: {
        hrBase: 0,
        z0: 'Z0',
        z1: 'Z1',
        z2: 'Z2',
        z3: 'Z3',
        z4: 'Z4',
        z5: 'Z5'
      },
      hrZoneTrend: {
        zoneZero: [],
        zoneOne: [],
        zoneTwo: [],
        zoneThree: [],
        zoneFour: [],
        zoneFive: []
      },
      thresholdZone: [0, 0, 0, 0, 0, 0, 0],
      thresholdZoneTrend: {
        zoneZero: [],
        zoneOne: [],
        zoneTwo: [],
        zoneThree: [],
        zoneFour: [],
        zoneFive: [],
        zoneSix: []
      }

    };

    this.totalCount = {
      stroke: 0,
      totalTime: 0,
      calories: 0,
      distance: 0,
      hr: 0,
      power: 0,
      speed: 0,
      cadence: 0,
      swolf: 0
    };

    this.haveDataLen = 0;
    this.groupAnalysis = {};
    this.personAnalysis = {};
  }

  /**
   * 取得使用者所篩選的條件
   * @author kidin-1091029
   */
  getReportSelectedCondition() {
    this.reportService.getReportCondition().pipe(
      switchMap(res => {
        const { progress } = this.uiFlag;
        this.uiFlag.progress = progress === 100 ? 0 : progress;
        this.initReportContent();
        const effectGroupId = (res as any).group.selectGroup.split('-'),
              fillStart = effectGroupId.length;
        effectGroupId.length = 6;
        const completeGroupId = effectGroupId.fill('0', fillStart, 6).join('-'),
              { id: currentGroupId } = this.groupInfo,
              listBody = {
                token: this.utils.getToken(),
                groupId: completeGroupId,
                groupLevel: this.utils.displayGroupLevel(completeGroupId),
                infoType: 5,
                avatarType: 3
              };

        if (currentGroupId === completeGroupId) {
          return of([res, this.memberList]);
        } else {
          this.groupInfo = this.assignGroupInfo(completeGroupId);
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
      if (this.uiFlag.progress === 0) {
        this.uiFlag.progress = 30;
        const [condition, memberList] = [...resArr as any],
              { 
                date: { 
                  startTimestamp,
                  endTimestamp
                },
                group: {
                  selectGroup
                }
              } = condition,
              {
                date: { 
                  startTimestamp: preStartTimestamp,
                  endTimestamp: preEndTimestamp
                },
                group: {
                  selectGroup: preSelectGroup
                }
              } = this.reportConditionOpt;

        // 日期範圍大於52天則取週報告
        this.reportTime.type = moment(endTimestamp).diff(moment(startTimestamp), 'day') <= 52 ? 1 : 2;

        // 若只更動運動類型，則不再call api取得數據
        if (
          this.uiFlag.inited
          && startTimestamp === preStartTimestamp
          && endTimestamp === preEndTimestamp
          && selectGroup === preSelectGroup
        ) {
          this.reportConditionOpt = this.utils.deepCopy(condition);
          this.personAnalysis = this.utils.deepCopy(memberList.analysisObj);
          this.createReport(this.sameTimeGroupData);
        } else {
          this.reportConditionOpt = this.utils.deepCopy(condition);
          this.createGroupAnalysisObj(this.groupList);

          // 若群組id不變，則使用已儲存之人員清單
          let memIdArr: Array<number>;
          if (selectGroup === preSelectGroup && this.uiFlag.inited) {
            memIdArr = [...this.memberList.noRepeatList];
          } else {
            if (!this.uiFlag.inited) this.uiFlag.inited = true;
            this.memberList.analysisObj = {};
            const memIdSet = new Set();
            memberList.forEach(_list => {
              const { groupId: _memGroupId, memberId, memberName } = _list;
              // 取得不重複的所有成員id，用來call api 2104
              memIdSet.add(_list.memberId);
              switch (this.groupInfo.level) {
                
              }
  
              // 生成個人分析物件，方便後續計算個人分析數據
              const { name: groupName } = this.groupAnalysis[_memGroupId];
              if (this.memberList.analysisObj[memberId]) {
                this.memberList.analysisObj[memberId].belongGroup.push({
                  name: groupName,
                  groupId: _memGroupId
                })
              } else {
                this.memberList.analysisObj = {
                  [memberId]: {
                    openPrivacy: false,
                    name: memberName,
                    belongGroup: [{
                      name: groupName,
                      groupId: _memGroupId
                    }]
                  },
                  ...this.memberList.analysisObj
                };
  
              }
  
            });

            memIdArr = (Array.from(memIdSet) as Array<number>).sort((a, b) => a - b);
            this.memberList.noRepeatList = this.utils.deepCopy(memIdArr);
          }

          this.personAnalysis = this.utils.deepCopy(this.memberList.analysisObj);
          this.getMemberData(memIdArr);
        }

      }

    });

  }

  /**
   * 取得面面所需的指定群組資訊
   * @param id {string}-group id
   * @author kidin-1100422
   */
  assignGroupInfo(id: string) {
    const {
      brands,
      branches,
      coaches
    } = this.groupList;

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
   * @author kidin-1100422
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
   * 取得目標群組成員數據
   * @author kidin-1100414
   */
  getMemberData(idList: Array<number>) {
    const { startTimestamp, endTimestamp } = this.reportConditionOpt.date,
          body = {
            token: this.utils.getToken(),
            type: this.reportTime.type,
            targetUserId: idList,
            filterStartTime: moment(startTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
            filterEndTime: moment(endTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
          };

    this.reportService.fetchSportSummaryArray(body).subscribe(res => {
      this.sameTimeGroupData = res;
      if (res.length && res.length > 0) {
        this.uiFlag.noData = false;
        this.uiFlag.progress = 70;
        this.createReport(res);
      } else {
        this.uiFlag.noData = true;
        this.uiFlag.progress = 100;
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
      this.dateLen = moment(endTimestamp).diff(moment(startTimestamp), 'day') + 1;
      dateRange = 86400000; // 間隔1天(ms)
    } else {
      reportStartDate = moment(startTimestamp).startOf('week').valueOf(),
      reportEndDate = moment(endTimestamp).startOf('week').valueOf();
      this.dateLen = moment(reportEndDate).diff(moment(reportStartDate), 'week') + 1;
      dateRange = 604800000;  // 間隔7天(ms)
    }

    for (let i = 0; i < this.dateLen; i++) {
      result.push(reportStartDate + dateRange * i);
    }

    return result;
  }

  /**
   * 統計數據以建立報告
   * @param data {Array<any>}-api 2104的數據
   * @author kidin-1100414
   */
  createReport(data: Array<any>) {
    const dataKey = this.reportTime.type === 1 ? 'reportActivityDays' : 'reportActivityWeeks',
          mixData = [],
          activityPeopleSet = new Set<number>();
    let haveData = false;
    data.forEach(_data => {
      const { resultCode, userId } = _data,
            activity = _data[dataKey];
      // 針對關閉隱私權的使用者建立對應物件
      if (resultCode !== 403) {
        this.personAnalysis[userId].openPrivacy = true;
        activity.forEach(_activity => {
          // 根據運動類別篩選數據
          const { startTime, activities } = _activity;
          activities.forEach(_activities => {
            const { type: sportType } = _activities,
                  { sportType: currentSportType } = this.reportConditionOpt;
            if (currentSportType === SportCode.all || currentSportType == sportType) {
              haveData = true;
              mixData.push({
                activities: [_activities],
                startTime
              });
  
              // 計算該運動類別活動人數用
              if (currentSportType !== SportCode.all) activityPeopleSet.add(_data.userId);
              this.handlePersonAnalysis(userId, _activities);
            };

          });

        });

      }
      
    });

    if (!haveData) {
      this.uiFlag.noData = true;
      this.uiFlag.progress = 100;
    } else {
      this.translate.get('hellow world').pipe(
        takeUntil(this.ngUnsubscribe)
      ).subscribe(() => {
        this.uiFlag.noData = false;
        const { sportType, date: {startTimestamp, endTimestamp} } = this.reportConditionOpt,
              rangeUnit = this.translate.instant('universal_time_day'),
              activePeopleNum = sportType === SportCode.all ? data.length : activityPeopleSet.size;
        this.reportTime = {
          create: moment().format('YYYY-MM-DD HH:mm'),
          endDate: moment(endTimestamp).format('YYYY-MM-DD'),
          range: `${moment(endTimestamp).diff(moment(startTimestamp), 'day') + 1}${rangeUnit}`,
          type: this.reportTime.type
        };

        this.info = {activePeopleNum, ...this.info};
        this.handleMixData(mixData);
        this.handleGroupAnalysis(this.personAnalysis);
        this.uiFlag.progress = 100;
      })
      
    }
console.log('personAnalysis', this.personAnalysis);
  }

  /**
   * 將所有成員數據進行排序與統計以生成概要數據與圖表
   * @param mix {Array<any>}-所有成員數據
   * @author kidin-1100415
   */
  handleMixData(mixData: Array<any>) {
    const { sportType } = this.reportConditionOpt;
    mixData.sort((a, b) => moment(a.startTime).valueOf() - moment(b.startTime).valueOf());
    const dateArr = this.createChartXaxis(this.reportConditionOpt.date, this.reportTime.type),
          noRepeatDateData = this.mergeSameDateData(mixData),
          needKey = this.getNeedKey(this.reportConditionOpt.sportType);
    let infoData = {},
        dataIdx = 0;
    for (let i = 0, len = dateArr.length; i < len; i++) {
      // 若無該日數據，則以補0方式呈現圖表數據。
      const xAxisTimestamp = dateArr[i],
            { startTimestamp, activities } = noRepeatDateData[dataIdx] || { startTimestamp: undefined, activities: undefined };
      if (xAxisTimestamp === startTimestamp) {
        let sameDateData = {},
            sameDateExtremeData = {};
        const activitiesLen = activities.length
        for (let j = 0; j < activitiesLen; j++) {
          const _activity = activities[j];
          if (sportType === SportCode.all) this.createAnalysisChartData(_activity);

          for (let k = 0, keyLen = needKey.length; k < keyLen; k++) {
            const key = needKey[k];
            if (_activity.hasOwnProperty(key)) {
              // 帶有plus字樣的key，其值必為正值，帶有minus字樣的key，其值必為負值
              let value: number;
              if (key.toLowerCase().includes('plus')) {
                value = Math.abs(_activity[key]);
              } else if (key.toLowerCase().includes('minus')) {
                value = -Math.abs(_activity[key]);
              } else {
                value = +_activity[key];
              }

              // 將數據加總以呈現概要資訊
              if (infoData[key] !== undefined) {
                infoData[key] += value;
              } else {
                infoData = {[key]: value, ...infoData};
              }

              // 將各數據加總，之後均化產生趨勢圖表
              if (sameDateData[key] !== undefined) {
                sameDateData[key] += value;
              } else {
                sameDateData = {[key]: value, ...sameDateData};
              }

              // 取得最大最小值供圖表使用
              const lowerCaseKey = key.toLowerCase(),
                    isExtremeKey = lowerCaseKey.includes('max') || lowerCaseKey.includes('min');
              if (isExtremeKey) {
                const currentVal = sameDateExtremeData[key];
                if (currentVal !== undefined) {
                  if (lowerCaseKey.includes('max') && value > currentVal) sameDateExtremeData[key] = value;
                  if (lowerCaseKey.includes('min') && value < currentVal) sameDateExtremeData[key] = value;
                } else {
                  sameDateExtremeData = {[key]: value, ...sameDateExtremeData};
                }

              }

            }

          }

        }

        this.createChartData(sameDateData, sameDateExtremeData, activitiesLen, xAxisTimestamp);
        this.haveDataLen++;
        dataIdx++;
      } else {
        let zeroData = {};
        for (let l = 0, keyLen = needKey.length; l < keyLen; l++) {
          const key = needKey[l];
          zeroData = {[key]: 0, ...zeroData};
        }

        this.createChartData(zeroData, undefined, 1, xAxisTimestamp);
      }

    }

    this.getTrendAvgValue();
    const {
      totalHrZone0Second: z0,
      totalHrZone1Second: z1,
      totalHrZone2Second: z2,
      totalHrZone3Second: z3,
      totalHrZone4Second: z4,
      totalHrZone5Second: z5
    } = infoData as any;
    const totalBenefitSecond = z2 + z3 + z4 + z5,  // 效益時間
          { startTimestamp, endTimestamp } = this.reportConditionOpt.date,
          diffWeek = (moment(endTimestamp).diff(moment(startTimestamp), 'day') + 1) / 7,
          pai = this.reportService.countPai([z0, z1, z2, z3, z4, z5], diffWeek); // pai指數
    this.info = {totalBenefitSecond, pai, ...infoData, ...this.info};
  }

  /**
   * 事先建立團體分析物件，以便後續計算數據與處理成員清單
   * @param groupList {any}-api 1103回覆的群組列表
   * @author kidin-1100511
   */
  createGroupAnalysisObj(groupList: any) {
    this.groupAnalysis = {};
    const { groupId, brands, branches, coaches } = groupList,
          groupLevel = this.utils.displayGroupLevel(groupId);

    coaches.forEach(_coach => {
      const { groupId: _coachId, groupName } = _coach;
      let parentsName: string;
      switch (groupLevel) {
        case GroupLevel.brand:
          for (let i = 0, len = branches.length; i < len; i++) {
            const { groupId: _branchId, groupName: _branchName } = branches[i],
                  partCoachId = this.groupService.getPartGroupId(_branchId, 4),
                  partBranchId = this.groupService.getPartGroupId(_coachId, 4);

            if (partBranchId === partCoachId) {
              parentsName = _branchName;
              break;
            }

          }

          break;
        default:
          const { groupName: branchName } = branches[0];
          parentsName = branchName;
          break;
      }

      this.groupAnalysis = {
        [_coachId]: {
          name: groupName,
          parentsName,
          memberList: [],
          memberSet: new Set<number>()
        },
        ...this.groupAnalysis
      };

    });

    if (groupLevel === GroupLevel.brand) {
      const { groupId: brandId, groupName: brandName } = brands[0];
      this.groupAnalysis = {
        [brandId]: {
          name: brandName,
          parentsName: '',
          memberList: []
        },
        ...this.groupAnalysis
      };

      branches.forEach(_branch => {
        const { groupId: _branchId, groupName } = _branch;
        this.groupAnalysis = {
          [_branchId]: {
            name: groupName,
            parentsName: brandName,
            memberList: []
          },
          ...this.groupAnalysis
        };

      });

    } else if (groupLevel === GroupLevel.branch) {
      const { groupName: brandName } = brands[0],
            { groupId: branchId, groupName } = branches[0];
      this.groupAnalysis = {
        [branchId]: {
          name: groupName,
          parentsName: brandName,
          memberList: []
        },
        ...this.groupAnalysis
      };

    }

  }

  /**
   * 統計個人用分析數據
   * @param userId {number}-使用者id
   * @param data {any}-一個單位日期/類別的數據
   * @author kidin-1100512
   */
  handlePersonAnalysis(userId: number, data: any) {
    const reportSportType = this.reportConditionOpt.sportType,
          needKey = this.getNeedKey(reportSportType);
    for (let i = 0, len = needKey.length; i < len; i++) {
      const key = needKey[i],
            value = +data[key];
      let assignPersonData = this.personAnalysis[userId][key];

      if (assignPersonData) {
        assignPersonData += value;
      } else {
        this.personAnalysis[userId] = {
          [key]: value,
          ...this.personAnalysis[userId]
        };

      }

    }

    // 依不同運動類別的特殊分析數據進行處理
    switch (reportSportType) {
      case SportCode.all:
        const {type: sportType, totalActivities} = data,
              { perTypeCount } = this.personAnalysis[userId],
              sportTypeArrIndex = +sportType - 1;
        if (perTypeCount) {
          perTypeCount[sportTypeArrIndex] += totalActivities;
        } else {
          // Object.keys(enum) => ["keys", "value"]，故長度除2
          const sportTypeLen = (Object.keys(SportCode)
            .filter(_key => typeof _key === 'string').length / 2) - 2;  // 扣掉rest和all兩個類別
          const typeCountArr = new Array(sportTypeLen).fill(0);
          typeCountArr[sportTypeArrIndex] += totalActivities;
          this.personAnalysis[userId] = {
            perTypeCount: typeCountArr,
            ...this.personAnalysis[userId]
          }
        }
        break;
      case SportCode.weightTrain:
        const { weightTrainingInfo, totalActivities: weightTrainActivities } = data;
        weightTrainingInfo.forEach(_info => {
          const { muscle, totalReps, totalSets, totalWeightKg } = _info;
          if (!this.personAnalysis[userId].totalSets) {
            this.personAnalysis[userId] = {
              totalSets: 0,
              muscleGroupCount: [0, 0, 0, 0, 0, 0],
              armMuscleGroup: [0, 0, 0],  // [totalWeight, reps, sets]
              pectoralsMuscle: [0, 0, 0],
              shoulderMuscle: [0, 0, 0],
              backMuscle: [0, 0, 0],
              abdominalMuscle: [0, 0, 0],
              legMuscle: [0, 0, 0],
              ...this.personAnalysis[userId]
            }

          }

          this.personAnalysis[userId].totalSets += totalSets;
          const {
            muscleGroupCount,
            armMuscleGroup,
            pectoralsMuscle,
            shoulderMuscle,
            backMuscle,
            abdominalMuscle,
            legMuscle,
          } = this.personAnalysis[userId];
          // 依肌群分別計算數據
          switch (+muscle) {
            case MuscleCode.bicepsInside:
            case MuscleCode.triceps:
            case MuscleCode.wristFlexor:
              muscleGroupCount[MuscleGroup.armMuscle] += weightTrainActivities;
              armMuscleGroup[0] += totalWeightKg;
              armMuscleGroup[1] += totalReps;
              armMuscleGroup[2] += totalSets;
              break;
            case MuscleCode.pectoralsMuscle:
            case MuscleCode.pectoralisUpper:
            case MuscleCode.pectoralisLower:
            case MuscleCode.pectoralsInside:
            case MuscleCode.pectoralsOutside:
            case MuscleCode.frontSerratus:
              muscleGroupCount[MuscleGroup.pectoralsMuscle] += weightTrainActivities;
              pectoralsMuscle[0] += totalWeightKg;
              pectoralsMuscle[1] += totalReps;
              pectoralsMuscle[2] += totalSets;
              break;
            case MuscleCode.shoulderMuscle:
            case MuscleCode.deltoidMuscle:
            case MuscleCode.deltoidAnterior:
            case MuscleCode.deltoidLateral:
            case MuscleCode.deltoidPosterior:
            case MuscleCode.trapezius:
              muscleGroupCount[MuscleGroup.shoulderMuscle] += weightTrainActivities;
              shoulderMuscle[0] += totalWeightKg;
              shoulderMuscle[1] += totalReps;
              shoulderMuscle[2] += totalSets;
              break;
            case MuscleCode.backMuscle:
            case MuscleCode.latissimusDorsi:
            case MuscleCode.erectorSpinae:
              muscleGroupCount[MuscleGroup.backMuscle] += weightTrainActivities;
              backMuscle[0] += totalWeightKg;
              backMuscle[1] += totalReps;
              backMuscle[2] += totalSets;
              break;
            case MuscleCode.abdominalMuscle:
            case MuscleCode.rectusAbdominis:
            case MuscleCode.rectusAbdominisUpper:
            case MuscleCode.rectusAbdominisLower:
            case MuscleCode.abdominisOblique:
              muscleGroupCount[MuscleGroup.abdominalMuscle] += weightTrainActivities;
              abdominalMuscle[0] += totalWeightKg;
              abdominalMuscle[1] += totalReps;
              abdominalMuscle[2] += totalSets;
              break;
            case MuscleCode.legMuscle:
            case MuscleCode.hipMuscle:
            case MuscleCode.quadricepsFemoris:
            case MuscleCode.hamstrings:
            case MuscleCode.ankleFlexor:
            case MuscleCode.gastrocnemius:
              muscleGroupCount[MuscleGroup.legMuscle] += weightTrainActivities;
              legMuscle[0] += totalWeightKg;
              legMuscle[1] += totalReps;
              legMuscle[2] += totalSets;
              break;
          }

        });

        break;
    }

  }

  /**
   * 統計團體用分析數據
   * @param personData {any}
   * @author kidin-1100512
   */
  handleGroupAnalysis(personData: any) {
    const { level } = this.groupInfo;
    for (let memberId of personData) {
      if (personData.hasOwnProperty(memberId)) {
        const { belongGroup, name, openPrivacy } = personData[memberId];
        for (let i = 0, len = belongGroup.length; i < len; i++) {
          const { groupId } = belongGroup[i],
                groupLevel = this.utils.displayGroupLevel(groupId),
                { memberList } = this.groupAnalysis[groupId],
                memberIncludes = memberList.includes(_mem => _mem.userId === +memberId);
          if (!memberIncludes) {
            this.groupAnalysis[groupId].memberList.push({
              name,
              userId: +memberId,
              openPrivacy
            });

            for (let key of personData[memberId]) {
              if (!['belongGroup', 'name', 'openPrivacy'].includes(key)) {
                if (this.groupAnalysis[groupId].hasOwnProperty(key)) {
                  this.groupAnalysis[groupId][key] += personData[memberId][key];
                } else {
                  this.groupAnalysis[groupId] = {
                    [key]: personData[memberId][key],
                    ...this.groupAnalysis[groupId]
                  };

                }

              }

            }

          }

        }

      }

    }
console.log('final groupAnalysis', this.groupAnalysis);
  }

  /**
   * 依運動類別製作各圖表所需數據
   * @param strokeData {any}-一個時間單位（日/週）加總的資料
   * @param extremeData {any}-一個時間單位（日/週）極端值的資料
   * @param denominator {number}-均化分母
   * @param startTimestamp {number}-該筆數據開始時間
   * @author kidin-1100421
   */
  createChartData(strokeData: any, extremeData: any, denominator: number, startTimestamp: number) {
    const { sportType } = this.reportConditionOpt;
    this.createTotalTimeChart(strokeData, startTimestamp);
    this.createHrChart(strokeData, extremeData, denominator, startTimestamp);
    this.createCaloriesChart(strokeData, startTimestamp);
    if (this.reportTime.type === 2) {
      this.createStrokeNumChart(strokeData, startTimestamp);
    }
    
    switch (sportType) {
      case SportCode.all:
        this.createHrZoneChart(strokeData, startTimestamp);
        break;
      case SportCode.run:
        this.createHrZoneChart(strokeData, startTimestamp);
        this.createDistanceChart(strokeData, startTimestamp);
        this.createSpeedPaceChart(strokeData, extremeData, denominator, startTimestamp, SportCode.run);
        this.createCadenceChart(strokeData, extremeData, denominator, startTimestamp, SportCode.run);
        break;
      case SportCode.cycle:
        this.createHrZoneChart(strokeData, startTimestamp);
        this.createThresholdChart(strokeData, startTimestamp);
        this.createDistanceChart(strokeData, startTimestamp);
        this.createPowerChart(strokeData, denominator, startTimestamp, SportCode.cycle);
        this.createSpeedPaceChart(strokeData, extremeData, denominator, startTimestamp, SportCode.cycle);
        this.createCadenceChart(strokeData, extremeData, denominator, startTimestamp, SportCode.cycle);
        break;
      case SportCode.weightTrain:
        break;
      case SportCode.swim:
        this.createHrZoneChart(strokeData, startTimestamp);
        this.createDistanceChart(strokeData, startTimestamp);
        this.createSpeedPaceChart(strokeData, extremeData, denominator, startTimestamp, SportCode.swim);
        this.createCadenceChart(strokeData, extremeData, denominator, startTimestamp, SportCode.swim);
        this.createSwolfChart(strokeData, extremeData, denominator, startTimestamp);
        break;
      case SportCode.aerobic:
        this.createHrZoneChart(strokeData, startTimestamp);
        break;
      case SportCode.row:
        this.createHrZoneChart(strokeData, startTimestamp);
        this.createDistanceChart(strokeData, startTimestamp);
        this.createPowerChart(strokeData, denominator, startTimestamp, SportCode.row);
        this.createSpeedPaceChart(strokeData, extremeData, denominator, startTimestamp, SportCode.row);
        this.createCadenceChart(strokeData, extremeData, denominator, startTimestamp, SportCode.row);
        break;
      case SportCode.ball:
        this.createHrZoneChart(strokeData, startTimestamp);
        this.createDistanceChart(strokeData, startTimestamp);
        this.createTotalGForceChart(strokeData, startTimestamp);
        this.createExtremeGForceChart(extremeData, startTimestamp);
        this.createSpeedPaceChart(strokeData, extremeData, denominator, startTimestamp, SportCode.ball);
        break;
    }

  }

  /**
   * 取得趨勢圖表所需平均值
   * @author kidin-1100505
   */
  getTrendAvgValue() {
    const { sportType } = this.reportConditionOpt,
          { type } = this.reportTime,
          {
            stroke,
            totalTime,
            calories,
            distance,
            hr,
            power,
            speed,
            cadence
          } = this.totalCount;

    this.chart.totalTimeTrend.avgTotalTime = totalTime / this.haveDataLen;
    this.chart.caloriesTrend.avgCalories = calories / this.haveDataLen;
    this.chart.hrTrend.avgHr = hr / this.haveDataLen;
    if (type === 2) {
      this.chart.strokeTrend.avgStrokeNum = stroke / this.haveDataLen;
    }
    
    switch (sportType) {
      case SportCode.all:
        
        break;
      case SportCode.run:
        this.chart.distanceTrend.avgDistance = distance / this.haveDataLen;
        this.chart.speedPaceTrend.avgSpeed = speed / this.haveDataLen;
        this.chart.cadenceTrend.avgCadence = cadence / this.haveDataLen;
        break;
      case SportCode.cycle:
        this.chart.distanceTrend.avgDistance = distance / this.haveDataLen;
        this.chart.powerTrend.avgPower = power / this.haveDataLen;
        this.chart.speedPaceTrend.avgSpeed = speed / this.haveDataLen;
        this.chart.cadenceTrend.avgCadence = cadence / this.haveDataLen;
        break;
      case SportCode.weightTrain:
        break;
      case SportCode.swim:
        this.chart.distanceTrend.avgDistance = distance / this.haveDataLen;
        this.chart.speedPaceTrend.avgSpeed = speed / this.haveDataLen;
        this.chart.cadenceTrend.avgCadence = cadence / this.haveDataLen;
        break;
      case SportCode.aerobic:
        
        break;
      case SportCode.row:
        this.chart.distanceTrend.avgDistance = distance / this.haveDataLen;
        this.chart.powerTrend.avgPower = power / this.haveDataLen;
        this.chart.speedPaceTrend.avgSpeed = speed / this.haveDataLen;
        this.chart.cadenceTrend.avgCadence = cadence / this.haveDataLen;
        break;
      case SportCode.ball:
        this.chart.distanceTrend.avgDistance = distance / this.haveDataLen;
        this.chart.speedPaceTrend.avgSpeed = speed / this.haveDataLen;
        break;
    }

  }

  /**
   * 建立佔比圖/成效分佈圖數據
   * @param data {any}-一個時間單位（日/週）的資料
   * @author kidin-1100421
   */
  createAnalysisChartData(data: any) {
    const { type, totalActivities, totalSecond, avgHeartRateBpm } = data,
          typeIndex = +type - 1,
          { ring: { stroke, time }, distribution: { typeList, perAvgHR, perActivityTime } } = this.chart;
    stroke[typeIndex] += totalActivities;
    time[typeIndex] += +totalSecond;
    typeList.push(type);
    perAvgHR.push(avgHeartRateBpm);
    perActivityTime.push(+totalSecond / totalActivities);
  }

  /**
   * 若為週報告，則建立活動筆數趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100505
   */
  createStrokeNumChart(data: any, startTimestamp: number) {
    const { totalActivities } = data,
          { strokeNum, maxStrokeNum } = this.chart.strokeTrend;
    strokeNum.push([startTimestamp, totalActivities]);
    this.totalCount.stroke += totalActivities;
    if (totalActivities > maxStrokeNum) {
      this.chart.strokeTrend.maxStrokeNum = totalActivities;
    }

  }

  /**
   * 建立活動時間趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100505
   */
  createTotalTimeChart(data: any, startTimestamp: number) {
    const { totalSecond } = data,
          { totalTime, maxTotalTime } = this.chart.totalTimeTrend;
    totalTime.push([startTimestamp, totalSecond]);
    this.totalCount.totalTime += totalSecond;
    if (totalSecond > maxTotalTime) {
      this.chart.totalTimeTrend.maxTotalTime = totalSecond;
    }

  }

  /**
   * 建立卡路里趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100505
   */
  createCaloriesChart(data: any, startTimestamp: number) {
    const { calories } = data,
          { calories: caloriesArr, maxCalories } = this.chart.caloriesTrend;
    caloriesArr.push([startTimestamp, calories] as any);
    this.totalCount.calories += calories;
    if (calories > maxCalories) {
      this.chart.caloriesTrend.maxCalories = calories;
    }

  }

  /**
   * 建立心率趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param extremeData {any}-一天（週）極端數據
   * @param denominator {number}-該天（週）運動總筆數
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100505
   */
  createHrChart(data: any, extremeData: any, denominator: number, startTimestamp: number) {
    const { avgHeartRateBpm } = data,
          avgMaxHeartRateBpm = extremeData ? extremeData.avgMaxHeartRateBpm : 0,
          { hrArr, maxHrArr, maxHr } = this.chart.hrTrend,
          oneDayAvgHr = avgHeartRateBpm / denominator;
    hrArr.push([startTimestamp, oneDayAvgHr]);
    maxHrArr.push([startTimestamp, avgMaxHeartRateBpm]);
    this.totalCount.hr += oneDayAvgHr;
    if (avgMaxHeartRateBpm > maxHr) {
      this.chart.hrTrend.maxHr = avgMaxHeartRateBpm;
    }

  }

  /**
   * 建立距離趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100505
   */
  createDistanceChart(data: any, startTimestamp: number) {
    const { totalDistanceMeters } = data,
          { distance, maxDistance } = this.chart.distanceTrend;
    distance.push([startTimestamp, totalDistanceMeters]);
    this.totalCount.distance += totalDistanceMeters;
    if (totalDistanceMeters > maxDistance) {
      this.chart.distanceTrend.maxDistance = totalDistanceMeters;
    }

  }

  /**
   * 建立功率趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param denominator {number}-該天（週）運動總筆數
   * @param startTimestamp {number}-該天（週）起始時間
   * @param type {SportType}-運動類型
   * @author kidin-1100505
   */
  createPowerChart(data: any, denominator: number, startTimestamp: number, type: SportType) {
    let maxRef: string,
        avgRef: string;
    switch (type) {
      case SportCode.cycle:
        maxRef = 'avgCycleMaxWatt';
        avgRef = 'cycleAvgWatt';
        break;
      case SportCode.row:
        maxRef = 'rowingMaxWatt';
        avgRef = 'rowingAvgWatt';
        break;
    }

    const avgWatt = data[avgRef] / denominator,
          maxWatt = data[maxRef] / denominator,
          { powerArr, maxPowerArr, maxPower } = this.chart.powerTrend;
    powerArr.push([startTimestamp, avgWatt]);
    maxPowerArr.push([startTimestamp, maxWatt]);
    this.totalCount.power += avgWatt;
    if (maxWatt > maxPower) {
      this.chart.powerTrend.maxPower = maxWatt;
    }

  }

  /**
   * 根據運動類別與使用者使用之單位建立配速趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param extremeData {any}-一天（週）的最大值
   * @param denominator {number}-該天（週）運動總筆數
   * @param startTimestamp {number}-該天（週）起始時間
   * @param type {SportType}-運動類型
   * @author kidin-1100505
   */
  createSpeedPaceChart(
    data: any,
    extremeData: any,
    denominator: number,
    startTimestamp: number,
    type: SportType
  ) {
    let avgSpeed: number,
        avgMaxSpeed: number;
    const extremeValue = extremeData ? extremeData.avgMaxSpeed : 0;
    switch (type) {
      case SportCode.cycle:
      case SportCode.ball:
        if (this.unit === unit.metric) {  // km/hr
          avgSpeed = (data.avgSpeed / denominator) || 0;
          avgMaxSpeed = extremeValue;
        } else {  // mi/hr
          avgSpeed = ((data.avgSpeed / mi) / denominator) || 0;
          avgMaxSpeed = extremeValue / mi;
        }
        break;
      case SportCode.run:
      case SportCode.swim:
      case SportCode.row:
        avgSpeed = ((data.avgSpeed) / denominator) || 0;
        avgMaxSpeed = extremeValue;
        break;
    }

    const { dataArr, maxSpeed, minSpeed } = this.chart.speedPaceTrend;
    if ([SportCode.run, SportCode.swim, SportCode.row].includes(type)) {

      if (avgSpeed !== 0) {
        dataArr.push({
          x: startTimestamp,
          y: this.utils.convertSpeed(avgMaxSpeed, type, this.unit, 'second') as number,
          low: this.utils.convertSpeed(avgSpeed, type, this.unit, 'second') as number
        });

      } else {
        dataArr.push({
          x: startTimestamp,
          y: null,
          low: null
        });
      }
      
    } else {
      dataArr.push({
        x: startTimestamp,
        y: avgMaxSpeed,
        low: avgSpeed
      });
    }

    this.totalCount.speed += avgSpeed;
    if (avgMaxSpeed > maxSpeed) {
      this.chart.speedPaceTrend.maxSpeed = avgMaxSpeed;
    }

    if ((minSpeed === null || minSpeed > avgSpeed) && avgSpeed !== 0) {
      this.chart.speedPaceTrend.minSpeed = avgSpeed;
    }

  }

  /**
   * 根據運動類別與使用者使用之單位建立頻率趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param extremeData {any}-一天（週）的最大值
   * @param denominator {number}-該天（週）運動總筆數
   * @param startTimestamp {number}-該天（週）起始時間
   * @param type {SportType}-運動類型
   * @author kidin-1100505
   */
  createCadenceChart(
    data: any,
    extremeData: any,
    denominator: number,
    startTimestamp: number,
    type: SportType
  ) {
    let avgCadence: number,
        rangeMaxCadence: number;
    switch (type) {
      case SportCode.run:
        const { runAvgCadence } = data,
              avgRunMaxCadence = extremeData ? extremeData.avgRunMaxCadence : 0;
        avgCadence = (runAvgCadence / denominator) || 0;
        rangeMaxCadence = avgRunMaxCadence;
        break
      case SportCode.cycle:
        const { cycleAvgCadence } = data,
              avgCycleMaxCadence = extremeData ? extremeData.avgCycleMaxCadence : 0;
        avgCadence = (cycleAvgCadence / denominator) || 0;
        rangeMaxCadence = avgCycleMaxCadence;
        break
      case SportCode.swim:
        const { swimAvgCadence } = data,
              avgSwimMaxCadence = extremeData ? extremeData.avgSwimMaxCadence : 0;
        avgCadence = (swimAvgCadence / denominator) || 0;
        rangeMaxCadence = avgSwimMaxCadence;
        break
      case SportCode.row:
        const { rowingAvgCadence } = data,
              avgRowingMaxCadence = extremeData ? extremeData.avgRowingMaxCadence : 0;
        avgCadence = (rowingAvgCadence / denominator) || 0;
        rangeMaxCadence = avgRowingMaxCadence;
        break;
    }

    const { dataArr, maxCadence, minCadence } = this.chart.cadenceTrend;
    if (avgCadence !== 0) {
      dataArr.push({
        x: startTimestamp,
        y: rangeMaxCadence,
        low: avgCadence
      });

    } else {
      dataArr.push({
        x: startTimestamp,
        y: null,
        low: null
      });
    }
      
    this.totalCount.cadence += avgCadence;
    if (rangeMaxCadence > maxCadence) {
      this.chart.cadenceTrend.maxCadence = rangeMaxCadence;
    }

    if ((minCadence === null || minCadence > avgCadence) && avgCadence !== 0) {
      this.chart.cadenceTrend.minCadence = avgCadence;
    }

  }

  /**
   * 建立游泳效益趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param extremeData {any}-一天（週）的最大值
   * @param denominator {number}-該天（週）運動總筆數
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100505
   */
  createSwolfChart(
    data: any,
    extremeData: any,
    denominator: number,
    startTimestamp: number
  ) {
    const { dataArr, maxSwolf, minSwolf } = this.chart.swolfTrend,
          avgSwolf = (data.avgSwolf / denominator) || 0,
          bestSwolf = extremeData ? extremeData.bestSwolf : 0;
    if (avgSwolf !== 0) {
      dataArr.push({
        x: startTimestamp,
        y: bestSwolf,
        low: avgSwolf
      });

    } else {
      dataArr.push({
        x: startTimestamp,
        y: null,
        low: null
      });
    }
      
    this.totalCount.swolf += avgSwolf;
    if (bestSwolf > maxSwolf) {
      this.chart.swolfTrend.maxSwolf = bestSwolf;
    }

    if ((minSwolf === null || minSwolf > avgSwolf) && avgSwolf !== 0) {
      this.chart.swolfTrend.minSwolf = avgSwolf;
    }

  }

  /**
   * 建立累積G值正負長條趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100506
   */
  createTotalGForceChart(data: any, startTimestamp: number) {
    const {
      totalPlusGforceX,
      totalPlusGforceY,
      totalPlusGforceZ,
      totalMinusGforceX,
      totalMinusGforceY,
      totalMinusGforceZ
    } = data;

    const {
      positiveData: xPositiveData,
      negativeData: xNegativeData,
      maxGForce: maxX,
      minGForce: minX
    } = this.chart.totalXAxisMoveTrend;

    const {
      positiveData: yPositiveData,
      negativeData: yNegativeData,
      maxGForce: maxY,
      minGForce: minY
    } = this.chart.totalYAxisMoveTrend;

    const {
      positiveData: zPositiveData,
      negativeData: zNegativeData,
      maxGForce: maxZ,
      minGForce: minZ
    } = this.chart.totalZAxisMoveTrend;

    xPositiveData.push([startTimestamp, totalPlusGforceX]);
    yPositiveData.push([startTimestamp, totalPlusGforceY]);
    zPositiveData.push([startTimestamp, totalPlusGforceZ]);
    xNegativeData.push([startTimestamp, totalMinusGforceX]);
    yNegativeData.push([startTimestamp, totalMinusGforceY]);
    zNegativeData.push([startTimestamp, totalMinusGforceZ]);
    if (totalPlusGforceX > maxX) {
      this.chart.totalXAxisMoveTrend.maxGForce = totalPlusGforceX;
    }

    if (totalPlusGforceY > maxY) {
      this.chart.totalYAxisMoveTrend.maxGForce = totalPlusGforceY;
    }

    if (totalPlusGforceZ > maxZ) {
      this.chart.totalZAxisMoveTrend.maxGForce = totalPlusGforceZ;
    }

    if (totalMinusGforceX < minX) {
      this.chart.totalXAxisMoveTrend.minGForce = totalMinusGforceX;
    }

    if (totalMinusGforceY < minY) {
      this.chart.totalYAxisMoveTrend.minGForce = totalMinusGforceY;
    }

    if (totalMinusGforceZ < minZ) {
      this.chart.totalZAxisMoveTrend.minGForce = totalMinusGforceZ;
    }

  }

  /**
   * 建立最大最小G值趨勢圖
   * @param extremeData {any}-一天（週）極端數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100506
   */
  createExtremeGForceChart(extremeData: any, startTimestamp: number) {
    let maxGforceX: number,
        maxGforceY: number,
        maxGforceZ: number,
        miniGforceX: number,
        miniGforceY: number,
        miniGforceZ: number;
    if (extremeData) {
      maxGforceX = extremeData.maxGforceX;
      maxGforceY = extremeData.maxGforceY;
      maxGforceZ = extremeData.maxGforceZ;
      miniGforceX = extremeData.miniGforceX;
      miniGforceY = extremeData.miniGforceY;
      miniGforceZ = extremeData.miniGforceZ;
    } else {
      maxGforceX = 0;
      maxGforceY = 0;
      maxGforceZ = 0;
      miniGforceX = 0;
      miniGforceY = 0;
      miniGforceZ = 0;
    }

    const { maxXArr, minXArr, maxX, minX } = this.chart.extremeXGForce,
          { maxYArr, minYArr, maxY, minY } = this.chart.extremeYGForce,
          { maxZArr, minZArr, maxZ, minZ } = this.chart.extremeZGForce;
    maxXArr.push([startTimestamp, maxGforceX]);
    minXArr.push([startTimestamp, miniGforceX]);
    maxYArr.push([startTimestamp, maxGforceY]);
    minYArr.push([startTimestamp, miniGforceY]);
    maxZArr.push([startTimestamp, maxGforceZ]);
    minZArr.push([startTimestamp, miniGforceZ]);
    if (maxGforceX > maxX) this.chart.extremeXGForce.maxX = maxGforceX;
    if (maxGforceY > maxY) this.chart.extremeYGForce.maxY = maxGforceY;
    if (maxGforceZ > maxZ) this.chart.extremeZGForce.maxZ = maxGforceZ;
    if (miniGforceX < minX) this.chart.extremeXGForce.minX = miniGforceX;
    if (miniGforceY < minY) this.chart.extremeYGForce.minY = miniGforceY;
    if (miniGforceZ < minZ) this.chart.extremeZGForce.minZ = miniGforceZ;
  }

  /**
   * 建立心率區間落點數據和心率區間趨勢圖數據
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100429
   */
  createHrZoneChart(data: any, startTimestamp: number) {
    const {
      totalHrZone0Second,
      totalHrZone1Second,
      totalHrZone2Second,
      totalHrZone3Second,
      totalHrZone4Second,
      totalHrZone5Second
    } = data;

    // 心率區間落點圖表
    let [z0, z1, z2, z3, z4, z5] = [...this.chart.hrzone];
    z0 += totalHrZone0Second;
    z1 += totalHrZone1Second;
    z2 += totalHrZone2Second;
    z3 += totalHrZone3Second;
    z4 += totalHrZone4Second;
    z5 += totalHrZone5Second;
    this.chart.hrzone = [z0, z1, z2, z3, z4, z5];

    // 心率區間趨勢圖表
    const {
      zoneZero,
      zoneOne,
      zoneTwo,
      zoneThree,
      zoneFour,
      zoneFive
    } = this.chart.hrZoneTrend;
    zoneZero.push([startTimestamp, totalHrZone0Second]);
    zoneOne.push([startTimestamp, totalHrZone1Second]);
    zoneTwo.push([startTimestamp, totalHrZone2Second]);
    zoneThree.push([startTimestamp, totalHrZone3Second]);
    zoneFour.push([startTimestamp, totalHrZone4Second]);
    zoneFive.push([startTimestamp, totalHrZone5Second]);
  }

  /**
   * 建立閾值區間落點數據和閾值區間趨勢圖數據
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100429
   */
  createThresholdChart(data: any, startTimestamp: number) {
    const {
      totalFtpZone0Second,
      totalFtpZone1Second,
      totalFtpZone2Second,
      totalFtpZone3Second,
      totalFtpZone4Second,
      totalFtpZone5Second,
      totalFtpZone6Second
    } = data;

    // 閾值區間落點圖表
    let [z0, z1, z2, z3, z4, z5, z6] = [...this.chart.thresholdZone];
    z0 += totalFtpZone0Second;
    z1 += totalFtpZone1Second;
    z2 += totalFtpZone2Second;
    z3 += totalFtpZone3Second;
    z4 += totalFtpZone4Second;
    z5 += totalFtpZone5Second;
    z6 += totalFtpZone6Second;
    this.chart.thresholdZone = [z0, z1, z2, z3, z4, z5, z6];

    // 閾值區間趨勢圖表
    const {
      zoneZero,
      zoneOne,
      zoneTwo,
      zoneThree,
      zoneFour,
      zoneFive,
      zoneSix
    } = this.chart.thresholdZoneTrend;
    zoneZero.push([startTimestamp, totalFtpZone0Second]);
    zoneOne.push([startTimestamp, totalFtpZone1Second]);
    zoneTwo.push([startTimestamp, totalFtpZone2Second]);
    zoneThree.push([startTimestamp, totalFtpZone3Second]);
    zoneFour.push([startTimestamp, totalFtpZone4Second]);
    zoneFive.push([startTimestamp, totalFtpZone5Second]);
    zoneSix.push([startTimestamp, totalFtpZone6Second]);
  }

  /**
   * 根據運動類別回傳所需數據的key
   * @param type {SportType}
   * @author kidin-1100419
   */
  getNeedKey(type: SportType) {
    switch (type) {
      case SportCode.run:
        return commonData.concat(runData);
      case SportCode.cycle:
        return commonData.concat(rideData);
      case SportCode.weightTrain:
        return commonData.concat(weightTrainData);
      case SportCode.swim:
        return commonData.concat(swimData);
      case SportCode.row:
        return commonData.concat(rowData);
      case SportCode.ball:
        return commonData.concat(ballData);
      default: // 共同、有氧
        return commonData;
    }

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
      const { startTime, activities } = data[i],
            { startTime: nextStartTime } = data[i + 1] || { startTime: undefined },
            startDate = startTime.split('T')[0],
            nextStartDate = nextStartTime ? nextStartTime.split('T')[0] : undefined;
      if (nextStartDate === startDate) {

        if (!sameDateData['startTimestamp']) {
          sameDateData = {
            startTimestamp: moment(startDate, 'YYYY-MM-DD').valueOf(),
            activities
          };
        } else {
          sameDateData['activities'] = sameDateData['activities'].concat(activities);
        }

      } else {

        if (!sameDateData['startTimestamp']) {
          result.push({
            startTimestamp: moment(startDate, 'YYYY-MM-DD').valueOf(),
            activities 
          });
        } else {
          sameDateData['activities'] = sameDateData['activities'].concat(activities);
          result.push(sameDateData);
          sameDateData = {};
        }
        
      }

    }

    return result;
  }

  /**
   * 覆蓋目前網址與預覽列印網址
   * @param resetUrl {boolean}
   * @author kidin-1100414
   */
  updateUrl(resetUrl: boolean) {

  }

  /**
   * 點擊分析列表的運動項目
   * @param sportType {SportType}
   * @author kidin-1100428
   */
  assignAnalysisType(sportType: SportType) {
    let { analysisType } = this.uiFlag;
    if (sportType === analysisType) {
      this.uiFlag.analysisType = SportCode.all;
    } else {
      this.uiFlag.analysisType = sportType;
    }

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