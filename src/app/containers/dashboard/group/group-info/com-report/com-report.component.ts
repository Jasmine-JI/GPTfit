import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { MatTableDataSource, MatSort, Sort } from '@angular/material';

import SimpleLinearRegression from 'ml-regression-simple-linear';
import * as moment from 'moment';
import { first } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { UtilsService } from '@shared/services/utils.service';
import { HashIdService } from '@shared/services/hash-id.service';
import { ReportService } from '../../../../../shared/services/report.service';
import { GroupService } from '../../../services/group.service';

@Component({
  selector: 'app-com-report',
  templateUrl: './com-report.component.html',
  styleUrls: ['./com-report.component.scss']
})
export class ComReportComponent implements OnInit, OnDestroy {

  @ViewChild('sortTable')
  sortTable: MatSort;

  // UI控制相關變數-kidin-1090115
  isLoading = false;
  isRxjsLoading = true;
  isPreviewMode = false;
  reportCompleted = true;
  initialChartComplated = false;
  nodata = false;
  dataDateRange = '';
  showReport = false;
  selectType = '99';
  showAll = false;
  personalMenu = {
    show: false,
    x: null,
    y: null
  };
  checkClickEvent = false;
  hadGroupMemberList = false;

  // 資料儲存用變數-kidin-1090115
  token: string;
  groupLevel: string;
  groupId: string;
  groupData: any;
  groupList: Array<any>;
  groupImg: string;
  brandImg: string;
  brandName = '';
  branchName = '';
  selectDate = {
    startDate: moment().subtract(6, 'days').format('YYYY-MM-DDT00:00:00.000Z'),
    endDate: moment().format('YYYY-MM-DDT23:59:59.999Z')
  };
  diffDay: number;
  reportCategory = '99';
  reportEndDate = '';
  period = '';
  reportRangeType = 1;
  reportCreatedTime = moment().format('YYYY/MM/DD HH:mm');
  hasDataNumber = 0;
  activitiesList: Array<any>;
  previewUrl = '';
  activityLength = 0;
  categoryActivityLength = 0;
  totalTime = '';
  avgTime = '';
  totalCalories = 0;
  avgCalories = 0;  // 日平均卡路里-kidin-1090320
  avgPersonCalories = 0;  // 人數平均卡路里-kidin-1090320
  totalDistance = 0;
  totalWeight = 0;
  totalHrZoneZero = 0;
  totalHrZoneOne = 0;
  totalHrZoneTwo = 0;
  totalHrZoneThree = 0;
  totalHrZoneFour = 0;
  totalHrZoneFive = 0;
  bestCalories = 0;
  bestCadence = 0;
  avgCadence = 0;
  bestHR = 0;
  avgHR = 0;
  bestPace = '';
  avgPace = '';
  bestSwolf = 0;
  avgSwolf = 0;
  bestSpeed = 0;
  avgSpeed = 0;
  bestPower = 0;
  avgPower = 0;
  personalData = new MatTableDataSource<any>();
  allPersonalData = [];
  personalPage = {
    info: '',
    report: ''
  };

  // 圖表用數據-kidin-1090115
  chartTimeStamp = [];
  searchDate = [];
  perTypeLength = [];
  perTypeTime = [];
  typeHrZone = [];
  perHrZoneData = [];
  perDate = [];
  perCalories = [];
  perSpeedData = [];
  perPaceData = [];
  perCadenceData = [];
  perSwolfData = [];
  perHRData = [];
  perPowerData = [];
  typeList = [];
  perAvgHR = [];
  perActivityTime = [];
  hrZoneRange = {
    HRBase: 0,
    z0: 'Z0',
    z1: 'Z1',
    z2: 'Z2',
    z3: 'Z3',
    z4: 'Z4',
    z5: 'Z5',
  };

  constructor(
    private utilsService: UtilsService,
    private hashIdService: HashIdService,
    private route: ActivatedRoute,
    private reportService: ReportService,
    private translate: TranslateService,
    private groupService: GroupService
  ) {
    document.addEventListener('click', this.hideMenu.bind(this));
  }

  ngOnInit() {
    this.token = this.utilsService.getToken();

    // 確認是否為預覽列印頁面-kidin-1090205
    if (location.search.indexOf('ipm=s') > -1) {
      this.isPreviewMode = true;
    }

    // 使用rxjs訂閱運動類別使運動類別更改時可以即時切換-kidin-1090121
    this.groupService.getreportCategory().pipe(first()).subscribe(res => {
      this.reportCategory = res;
      this.loadCategoryData(res);
    });

    this.personalData.sort = this.sortTable;

  }

  // 先從rxjs取得成員ID清單，若取不到再call api-kidin-1090211
  getIdListStart () {
    const hashGroupId = this.route.snapshot.paramMap.get('groupId');

    this.groupId = this.hashIdService.handleGroupIdDecode(hashGroupId);
    this.groupLevel = this.utilsService.displayGroupLevel(this.groupId);

    this.groupService.getMemberList().pipe(first()).subscribe(res => {
      if (res.groupId === '' || res.groupId !== this.groupId) {
        // 先從service取得群組資訊，若取不到再call api-kidin-1081210
        this.groupService.getGroupInfo().subscribe(result => {
          this.groupData = result;
          if (this.groupData.hasOwnProperty('groupId')) {
            this.showGroupInfo();
          } else {
            const groupBody = {
              token: this.token,
              groupId: this.groupId,
              findRoot: '1',
              avatarType: '2'
            };

            this.groupService.fetchGroupListDetail(groupBody).subscribe(data => {
              this.groupData = data.info;
              this.groupService.saveGroupInfo(this.groupData);
              this.showGroupInfo();
            });
          }
        });

        this.getGroupMemberIdList();
      } else {
        this.groupList = res.groupList;
        this.groupService.getGroupInfo().subscribe(result => {
          this.groupData = result;
          this.showGroupInfo();
        });

        this.handleSubmitSearch('click');
      }
    });

    this.hadGroupMemberList = true;
  }

  // 取得所有成員id list並使用rxjs儲存至service-kidin-10900310
  getGroupMemberIdList() {
    const body = {
      token: this.token,
      groupId: this.groupId,
      groupLevel: this.groupLevel,
      infoType: 5,
      avatarType: 3
    };

    this.groupService.fetchGroupMemberList(body).subscribe(res => {
      const listId = new Set(),  // 避免id重複(Bug 1150)-kidin-1090211
            listName = new Set(),
            memberList = res.info.groupMemberInfo;

      for (let i = 0; i < memberList.length; i++) {
        const memberGroupIdArr = memberList[i].groupId.split('-'),
              groupIdArr = this.groupId.split('-');

        switch (this.groupLevel) {
          case '30':
            memberGroupIdArr.length = 3;
            groupIdArr.length = 3;
            if (memberList[i].accessRight >= 50 && JSON.stringify(memberGroupIdArr) === JSON.stringify(groupIdArr)) {
              listId.add(memberList[i].memberId);
              listName.add(memberList[i].memberName);
            }
            break;
          case '40':
            memberGroupIdArr.length = 4;
            groupIdArr.length = 4;
            if (memberList[i].accessRight >= 50 && JSON.stringify(memberGroupIdArr) === JSON.stringify(groupIdArr)) {
              listId.add(memberList[i].memberId);
              listName.add(memberList[i].memberName);
            }
            break;
          case '60':
            if (memberList[i].accessRight >= 50 && memberList[i].groupId === this.groupId) {
              listId.add(memberList[i].memberId);
              listName.add(memberList[i].memberName);
            }
            break;
        }
      }

      const listIdArr = Array.from(listId),
            listNameArr = Array.from(listName),
            list = listIdArr.map((_id, _idx) => {
              return {
                id: _id,
                name: listNameArr[_idx]
              };
            });

      this.groupList = list;
      const groupListInfo = {
        groupId: this.groupId,
        groupList: this.groupList
      };
      this.groupService.setMemberList(groupListInfo);

      // 確認網址是否帶有query string-kidin-1090212
      if (
        location.search.indexOf('startdate=') > -1 &&
        location.search.indexOf('enddate=') > -1
      ) {
        this.queryStringShowData();
      } else {
        this.handleSubmitSearch('click');
      }
    });

  }

  // 依query string顯示資料-kidin-20191226
  queryStringShowData () {
    const queryString = location.search.replace('?', '').split('&');
    for (let i = 0; i < queryString.length; i++) {
      if (queryString[i].indexOf('startdate=') > -1) {
        this.selectDate.startDate = moment(queryString[i].replace('startdate=', '')).format('YYYY-MM-DDT00:00:00.000Z');
      } else if (queryString[i].indexOf('enddate=') > -1) {
        this.selectDate.endDate = moment(queryString[i].replace('enddate=', '')).format('YYYY-MM-DDT23:59:59.999Z');
      }
    }

    this.handleSubmitSearch('url');
  }

  // 取得所選日期-kidin-1090331
  getSelectDate (date) {
    this.selectDate = date;
    if (this.hadGroupMemberList === false) {
      this.getIdListStart();
    } else {
      this.handleSubmitSearch('click');
    }

  }

  // 使用者送出表單後顯示相關資料-kidin-1081209
  handleSubmitSearch (act) {
    if (act === 'click') {
      this.updateUrl('false');
    }
    this.reportCompleted = false;
    this.createReport();
  }

  // 建立運動報告-kidin-1090117
  createReport () {
    this.isLoading = true;
    this.diffDay = moment(this.selectDate.endDate).diff(moment(this.selectDate.startDate), 'days') + 1;
    this.period = `${this.diffDay}${this.translate.instant(
      'Dashboard.SportReport.day'
    )}`;

    this.initVariable();

    // 52天內取日概要陣列，52天以上取周概要陣列-kidin_1090211
    if (this.diffDay <= 52) {
      this.reportRangeType = 1;
      this.dataDateRange = 'day';
    } else {
      this.reportRangeType = 2;
      this.dataDateRange = 'week';
    }

    const groupIdList = [];
    for (let i = 0; i < this.groupList.length; i++) {
      groupIdList.push(this.groupList[i].id);
    }

    const body = {
      token: this.token || '',
      type: this.reportRangeType,
      targetUserId: groupIdList,
      filterStartTime: this.selectDate.startDate,
      filterEndTime: this.selectDate.endDate,
      improveFormat: '2'
    };

    const summaryData = [];
    this.reportService.fetchSportSummaryArray(body).subscribe(res => {
      if (Array.isArray(res)) {
        let groupReportData = [];
        for (let j = 0; j < res.length; j++) {
          // 計算有資料的人數，並將資料合併-kidin-1090212
          if (this.reportRangeType === 1) {
            this.allPersonalData.push(this.getPersonalStatistics(res[j].reportActivityDays, j));

            if (res[j].reportActivityDays && res[j].reportActivityDays.length > 0) {
              this.hasDataNumber++;
              groupReportData = groupReportData.concat(res[j].reportActivityDays);
              summaryData.push(res[j].reportActivityDays);
            }
          } else {
            this.allPersonalData.push(this.getPersonalStatistics(res[j].reportActivityWeeks, j));

            if (res[j].reportActivityWeeks && res[j].reportActivityWeeks.length > 0) {
              this.hasDataNumber++;
              groupReportData = groupReportData.concat(res[j].reportActivityWeeks);
              summaryData.push(res[j].reportActivityWeeks);
            }
          }
        }

        this.personalData.data = this.allPersonalData.slice();
        if (this.personalData.data.length > 20) {
          this.personalData.data.length = 20;
          this.showAll = false;
        } else {
          this.showAll = true;
        }

        // 若沒有任何運動數據則顯示無資料-kidin-1090212
        if (this.hasDataNumber === 0) {
          this.nodata = true;
          this.isLoading = false;
          this.updateUrl('false');
        } else {
          this.nodata = false;
          this.reportEndDate = moment(this.selectDate.endDate.split('T')[0]).format('YYYY/MM/DD');
          this.showReport = true;
          this.updateUrl('true');
          this.sortData(groupReportData);
          this.createTimeStampArr(this.diffDay);
          this.calPerCategoryData();
        }
      } else {
        this.nodata = true;
        this.isLoading = false;
        this.updateUrl('false');
      }
    });
  }

  // 初始化變數
  initVariable () {
    this.nodata = false;
    this.hasDataNumber = 0;
    this.activityLength = 0;
    this.totalTime = '00:00';
    this.avgTime = '00:00';
    this.totalDistance = 0;
    this.totalWeight = 0;
    this.totalHrZoneZero = 0;
    this.totalHrZoneOne = 0;
    this.totalHrZoneThree = 0;
    this.totalHrZoneFour = 0;
    this.totalHrZoneFive = 0;
    this.avgCalories = 0;
    this.avgPersonCalories = 0;
    this.totalCalories = 0;
    this.groupService.setTypeAllData({}, {}, {}, {}, {}, {}, {});
    this.perHrZoneData = [];
    this.perTypeLength = [];
    this.perTypeTime = [];
    this.typeHrZone = [];
    this.perDate = [];
    this.personalData.data.length = 0;
    this.allPersonalData = [];
    this.chartTimeStamp = [];
    this.searchDate = [];
  }

  // 建立報告期間的timeStamp讓圖表使用-kidin-1090324
  createTimeStampArr (range) {

    this.searchDate = [
      moment(this.selectDate.startDate.split('T')[0], 'YYYY-MM-DD').valueOf(),
      moment(this.selectDate.endDate.split('T')[0], 'YYYY-MM-DD').valueOf()
    ];

    if (this.dataDateRange === 'day') {

      for (let i = 0; i < range; i++) {
        this.chartTimeStamp.push(this.searchDate[0] + 86400000 * i);
      }

    } else {
      const weekCoefficient = this.findDate();

      for (let i = 0; i < weekCoefficient.weekNum; i++) {
        this.chartTimeStamp.push(weekCoefficient.startDate + 86400000 * i * 7);
      }

    }

  }

  // 根據搜索時間取得周報告第一周的開始日期和週數-kidin-1090324
  findDate () {

    const week = {
      startDate: 0,
      weekNum: 0
    };

    let weekEndDate;

    // 周報告開頭是星期日-kidin-1090312
    if (moment(this.searchDate[0]).isoWeekday() !== 7) {
      week.startDate = this.searchDate[0] + 86400 * 1000 * (7 - moment(this.searchDate[0]).isoWeekday());
    } else {
      week.startDate = this.searchDate[0];
    }

    if (moment(this.searchDate[0]).isoWeekday() !== 7) {
      weekEndDate = this.searchDate[1] - 86400 * 1000 * moment(this.searchDate[1]).isoWeekday();
    } else {
      weekEndDate = this.searchDate[1];
    }

    week.weekNum = ((weekEndDate - week.startDate) / (86400 * 1000 * 7)) + 1;

    return week;
  }

  // 將合併的資料進行排序
  sortData (data) {
    const sortResult = [...data];

    let swapped = true;
    for (let i = 0; i < data.length && swapped; i++) {
      swapped = false;
      for (let j = 0; j < data.length - 1 - i; j++) {
        const frontData = moment(sortResult[j].startTime.split('T')[0]),
              afterData = moment(sortResult[j + 1].startTime.split('T')[0]);
        if (afterData.diff(frontData, 'days') < 0) {
          swapped = true;
          [sortResult[j], sortResult[j + 1]] = [sortResult[j + 1], sortResult[j]];
        }
      }
    }

    this.activitiesList = sortResult;
  }

  // 計算各種所需數據-kidin-1090120
  calPerCategoryData () {
    const typeList = [],
          typeAllHrZoneData = [],
          typeAllCalories = [],
          typeAllDataDate = [],
          typeAllavgHr = [],
          typeAllActivityTime = [],
          typeRunHrZoneData = [],
          typeRunCalories = [],
          typeRunDataDate = [],
          typeRunSpeed = [],
          typeRunMaxSpeed = [],
          typeRunCadence = [],
          typeRunMaxCadence = [],
          typeRunHR = [],
          typeRunMaxHR = [],
          typeCycleHrZoneData = [],
          typeCycleCalories = [],
          typeCycleDataDate = [],
          typeCycleSpeed = [],
          typeCycleMaxSpeed = [],
          typeCycleCadence = [],
          typeCycleMaxCadence = [],
          typeCycleHR = [],
          typeCycleMaxHR = [],
          typeCyclePower = [],
          typeCycleMaxPower = [],
          typeWeightTrainCalories = [],
          typeWeightTrainDataDate = [],
          typeSwimHrZoneData = [],
          typeSwimCalories = [],
          typeSwimDataDate = [],
          typeSwimSpeed = [],
          typeSwimMaxSpeed = [],
          typeSwimCadence = [],
          typeSwimMaxCadence = [],
          typeSwimSwolf = [],
          typeSwimMaxSwolf = [],
          typeSwimHR = [],
          typeSwimMaxHR = [],
          typeAerobicHrZoneData = [],
          typeAerobicCalories = [],
          typeAerobicDataDate = [],
          typeAerobicHR = [],
          typeAerobicMaxHR = [],
          typeRowHrZoneData = [],
          typeRowCalories = [],
          typeRowDataDate = [],
          typeRowSpeed = [],
          typeRowMaxSpeed = [],
          typeRowCadence = [],
          typeRowMaxCadence = [],
          typeRowHR = [],
          typeRowMaxHR = [],
          typeRowPower = [],
          typeRowMaxPower = [];

    let typeAllTotalTrainTime = 0,
        typeAllTotalDistance = 0,
        typeAllTotalWeight = 0,
        typeAllHrZoneZero = 0,
        typeAllHrZoneOne = 0,
        typeAllHrZoneTwo = 0,
        typeAllHrZoneThree = 0,
        typeAllHrZoneFour = 0,
        typeAllHrZoneFive = 0,
        typeRunLength = 0,
        typeRunTotalTrainTime = 0,
        typeRunTotalDistance = 0,
        typeRunHrZoneZero = 0,
        typeRunHrZoneOne = 0,
        typeRunHrZoneTwo = 0,
        typeRunHrZoneThree = 0,
        typeRunHrZoneFour = 0,
        typeRunHrZoneFive = 0,
        typeCycleLength = 0,
        typeCycleTotalTrainTime = 0,
        typeCycleTotalDistance = 0,
        typeCycleHrZoneZero = 0,
        typeCycleHrZoneOne = 0,
        typeCycleHrZoneTwo = 0,
        typeCycleHrZoneThree = 0,
        typeCycleHrZoneFour = 0,
        typeCycleHrZoneFive = 0,
        typeWeightTrainLength = 0,
        typeWeightTrainTotalTrainTime = 0,
        typeWeightTrainTotalWeight = 0,
        typeSwimLength = 0,
        typeSwimTotalTrainTime = 0,
        typeSwimTotalDistance = 0,
        typeSwimHrZoneZero = 0,
        typeSwimHrZoneOne = 0,
        typeSwimHrZoneTwo = 0,
        typeSwimHrZoneThree = 0,
        typeSwimHrZoneFour = 0,
        typeSwimHrZoneFive = 0,
        typeAerobicLength = 0,
        typeAerobicTotalTrainTime = 0,
        typeAerobicHrZoneZero = 0,
        typeAerobicHrZoneOne = 0,
        typeAerobicHrZoneTwo = 0,
        typeAerobicHrZoneThree = 0,
        typeAerobicHrZoneFour = 0,
        typeAerobicHrZoneFive = 0,
        typeRowLength = 0,
        typeRowTotalTrainTime = 0,
        typeRowTotalDistance = 0,
        typeRowHrZoneZero = 0,
        typeRowHrZoneOne = 0,
        typeRowHrZoneTwo = 0,
        typeRowHrZoneThree = 0,
        typeRowHrZoneFour = 0,
        typeRowHrZoneFive = 0;

    for (let i = 0; i < this.activitiesList.length; i++) {

      for (let j = 0; j < this.activitiesList[i].activities.length; j++) {
        const perData = this.activitiesList[i].activities[j];

        this.activityLength += +perData['totalActivities'];
        typeAllTotalTrainTime += +perData['totalSecond'];
        typeList.push(perData['type']);
        typeAllCalories.push(perData['calories']);
        typeAllDataDate.push(this.activitiesList[i].startTime.split('T')[0]);
        typeAllavgHr.push(perData['avgHeartRateBpm']);
        typeAllActivityTime.push(
          +perData['totalSecond'] / perData['totalActivities']
        );

        // 確認是否有距離數據-kidin-1090204
        if (perData['totalDistanceMeters']) {
          typeAllTotalDistance += perData['totalDistanceMeters'];
        }

        // 確認是否有重量數據-kidin-1090204
        if (perData['totalWeightKg']) {
          typeAllTotalWeight += perData['totalWeightKg'];
        }

        // 活動成效分佈圖和心率區間趨勢用資料-kidin-1090203
        if (perData['totalHrZone0Second'] !== null) {
          typeAllHrZoneZero += perData['totalHrZone0Second'];
          typeAllHrZoneOne += perData['totalHrZone1Second'];
          typeAllHrZoneTwo += perData['totalHrZone2Second'];
          typeAllHrZoneThree += perData['totalHrZone3Second'];
          typeAllHrZoneFour += perData['totalHrZone4Second'];
          typeAllHrZoneFive += perData['totalHrZone5Second'];
          if (
            perData['totalHrZone0Second'] +
            perData['totalHrZone1Second'] +
            perData['totalHrZone2Second'] +
            perData['totalHrZone3Second'] +
            perData['totalHrZone4Second'] +
            perData['totalHrZone5Second'] !== 0
          ) {
            typeAllHrZoneData.push([
              perData.type,
              perData['totalHrZone0Second'],
              perData['totalHrZone1Second'],
              perData['totalHrZone2Second'],
              perData['totalHrZone3Second'],
              perData['totalHrZone4Second'],
              perData['totalHrZone5Second'],
              this.activitiesList[i].startTime.split('T')[0]
            ]);
          }
        }

        // 根據不同類別計算數據-kidin-1090204
        switch (perData.type) {
          case '1':
            typeRunLength += +perData['totalActivities'];
            typeRunTotalTrainTime += +perData['totalSecond'];
            typeRunCalories.push(perData['calories']);
            typeRunTotalDistance += perData['totalDistanceMeters'];
            typeRunDataDate.push(this.activitiesList[i].startTime.split('T')[0]);
            typeRunSpeed.push(perData['avgSpeed']);
            typeRunMaxSpeed.push(perData['avgMaxSpeed']);
            typeRunCadence.push(perData['runAvgCadence']);
            typeRunMaxCadence.push(perData['avgRunMaxCadence']);
            typeRunHR.push(perData['avgHeartRateBpm']);
            typeRunMaxHR.push(perData['avgMaxHeartRateBpm']);


            // 確認是否有心率數據-kidin-1090204
            if (perData['totalHrZone0Second'] !== null) {
              typeRunHrZoneZero += perData['totalHrZone0Second'];
              typeRunHrZoneOne += perData['totalHrZone1Second'];
              typeRunHrZoneTwo += perData['totalHrZone2Second'];
              typeRunHrZoneThree += perData['totalHrZone3Second'];
              typeRunHrZoneFour += perData['totalHrZone4Second'];
              typeRunHrZoneFive += perData['totalHrZone5Second'];
              if (
                perData['totalHrZone0Second'] +
                perData['totalHrZone1Second'] +
                perData['totalHrZone2Second'] +
                perData['totalHrZone3Second'] +
                perData['totalHrZone4Second'] +
                perData['totalHrZone5Second'] !== 0
              ) {
                typeRunHrZoneData.push([
                  perData.type,
                  perData['totalHrZone0Second'],
                  perData['totalHrZone1Second'],
                  perData['totalHrZone2Second'],
                  perData['totalHrZone3Second'],
                  perData['totalHrZone4Second'],
                  perData['totalHrZone5Second'],
                  this.activitiesList[i].startTime.split('T')[0]
                ]);
              }
            }

            break;
          case '2':
            typeCycleLength += +perData['totalActivities'];
            typeCycleTotalTrainTime += +perData['totalSecond'];
            typeCycleCalories.push(perData['calories']);
            typeCycleTotalDistance += perData['totalDistanceMeters'];
            typeCycleDataDate.push(this.activitiesList[i].startTime.split('T')[0]);
            typeCycleSpeed.push(perData['avgSpeed']);
            typeCycleMaxSpeed.push(perData['avgMaxSpeed']);
            typeCycleCadence.push(perData['cycleAvgCadence']);
            typeCycleMaxCadence.push(perData['avgCycleMaxCadence']);
            typeCycleHR.push(perData['avgHeartRateBpm']);
            typeCycleMaxHR.push(perData['avgMaxHeartRateBpm']);
            typeCyclePower.push(perData['cycleAvgWatt']);
            typeCycleMaxPower.push(perData['avgCycleMaxWatt']);

            if (perData['totalHrZone0Second'] !== null) {
              typeCycleHrZoneZero += perData['totalHrZone0Second'];
              typeCycleHrZoneOne += perData['totalHrZone1Second'];
              typeCycleHrZoneTwo += perData['totalHrZone2Second'];
              typeCycleHrZoneThree += perData['totalHrZone3Second'];
              typeCycleHrZoneFour += perData['totalHrZone4Second'];
              typeCycleHrZoneFive += perData['totalHrZone5Second'];
              if (
                perData['totalHrZone0Second'] +
                perData['totalHrZone1Second'] +
                perData['totalHrZone2Second'] +
                perData['totalHrZone3Second'] +
                perData['totalHrZone4Second'] +
                perData['totalHrZone5Second'] !== 0
              ) {
                typeCycleHrZoneData.push([
                  perData.type,
                  perData['totalHrZone0Second'],
                  perData['totalHrZone1Second'],
                  perData['totalHrZone2Second'],
                  perData['totalHrZone3Second'],
                  perData['totalHrZone4Second'],
                  perData['totalHrZone5Second'],
                  this.activitiesList[i].startTime.split('T')[0]
                ]);
              }
            }

            break;
          case '3':
            typeWeightTrainLength += +perData['totalActivities'];
            typeWeightTrainTotalTrainTime += +perData['totalSecond'];
            typeWeightTrainCalories.push(perData['calories']);
            typeWeightTrainTotalWeight += perData['totalWeightKg'];
            typeWeightTrainDataDate.push(this.activitiesList[i].startTime.split('T')[0]);

            break;
          case '4':
            typeSwimLength += +perData['totalActivities'];
            typeSwimTotalTrainTime += +perData['totalSecond'];
            typeSwimCalories.push(perData['calories']);
            typeSwimTotalDistance += perData['totalDistanceMeters'];
            typeSwimDataDate.push(this.activitiesList[i].startTime.split('T')[0]);
            typeSwimSpeed.push(perData['avgSpeed']);
            typeSwimMaxSpeed.push(perData['avgMaxSpeed']);
            typeSwimCadence.push(perData['swimAvgCadence']);
            typeSwimMaxCadence.push(perData['avgSwimMaxCadence']);
            typeSwimSwolf.push(perData['avgSwolf']);
            typeSwimMaxSwolf.push(perData['bestSwolf']);
            typeSwimHR.push(perData['avgHeartRateBpm']);
            typeSwimMaxHR.push(perData['avgMaxHeartRateBpm']);

            if (perData['totalHrZone0Second'] !== null) {
              typeSwimHrZoneZero += perData['totalHrZone0Second'];
              typeSwimHrZoneOne += perData['totalHrZone1Second'];
              typeSwimHrZoneTwo += perData['totalHrZone2Second'];
              typeSwimHrZoneThree += perData['totalHrZone3Second'];
              typeSwimHrZoneFour += perData['totalHrZone4Second'];
              typeSwimHrZoneFive += perData['totalHrZone5Second'];
              if (
                perData['totalHrZone0Second'] +
                perData['totalHrZone1Second'] +
                perData['totalHrZone2Second'] +
                perData['totalHrZone3Second'] +
                perData['totalHrZone4Second'] +
                perData['totalHrZone5Second'] !== 0
              ) {
                typeSwimHrZoneData.push([
                  perData.type,
                  perData['totalHrZone0Second'],
                  perData['totalHrZone1Second'],
                  perData['totalHrZone2Second'],
                  perData['totalHrZone3Second'],
                  perData['totalHrZone4Second'],
                  perData['totalHrZone5Second'],
                  this.activitiesList[i].startTime.split('T')[0]
                ]);
              }
            }

            break;
          case '5':
            typeAerobicLength += +perData['totalActivities'];
            typeAerobicTotalTrainTime += +perData['totalSecond'];
            typeAerobicCalories.push(perData['calories']);
            typeAerobicDataDate.push(this.activitiesList[i].startTime.split('T')[0]);
            typeAerobicHR.push(perData['avgHeartRateBpm']);
            typeAerobicMaxHR.push(perData['avgMaxHeartRateBpm']);

            if (perData['totalHrZone0Second'] !== null) {
              typeAerobicHrZoneZero += perData['totalHrZone0Second'];
              typeAerobicHrZoneOne += perData['totalHrZone1Second'];
              typeAerobicHrZoneTwo += perData['totalHrZone2Second'];
              typeAerobicHrZoneThree += perData['totalHrZone3Second'];
              typeAerobicHrZoneFour += perData['totalHrZone4Second'];
              typeAerobicHrZoneFive += perData['totalHrZone5Second'];
              if (
                perData['totalHrZone0Second'] +
                perData['totalHrZone1Second'] +
                perData['totalHrZone2Second'] +
                perData['totalHrZone3Second'] +
                perData['totalHrZone4Second'] +
                perData['totalHrZone5Second'] !== 0
              ) {
                typeAerobicHrZoneData.push([
                  perData.type,
                  perData['totalHrZone0Second'],
                  perData['totalHrZone1Second'],
                  perData['totalHrZone2Second'],
                  perData['totalHrZone3Second'],
                  perData['totalHrZone4Second'],
                  perData['totalHrZone5Second'],
                  this.activitiesList[i].startTime.split('T')[0]
                ]);
              }
            }

            break;
          case '6':
            typeRowLength += +perData['totalActivities'];
            typeRowTotalTrainTime += +perData['totalSecond'];
            typeRowCalories.push(perData['calories']);
            typeRowTotalDistance += perData['totalDistanceMeters'];
            typeRowDataDate.push(this.activitiesList[i].startTime.split('T')[0]);
            typeRowSpeed.push(perData['avgSpeed']);
            typeRowMaxSpeed.push(perData['avgMaxSpeed']);
            typeRowCadence.push(perData['rowingAvgCadence']);
            typeRowMaxCadence.push(perData['avgRowingMaxCadence']);
            typeRowHR.push(perData['avgHeartRateBpm']);
            typeRowMaxHR.push(perData['avgMaxHeartRateBpm']);
            typeRowPower.push(perData['rowingAvgWatt']);
            typeRowMaxPower.push(perData['rowingMaxWatt']);

            if (perData['totalHrZone0Second'] !== null) {
              typeRowHrZoneZero += perData['totalHrZone0Second'];
              typeRowHrZoneOne += perData['totalHrZone1Second'];
              typeRowHrZoneTwo += perData['totalHrZone2Second'];
              typeRowHrZoneThree += perData['totalHrZone3Second'];
              typeRowHrZoneFour += perData['totalHrZone4Second'];
              typeRowHrZoneFive += perData['totalHrZone5Second'];
              if (
                perData['totalHrZone0Second'] +
                perData['totalHrZone1Second'] +
                perData['totalHrZone2Second'] +
                perData['totalHrZone3Second'] +
                perData['totalHrZone4Second'] +
                perData['totalHrZone5Second'] !== 0
              ) {
                typeRowHrZoneData.push([
                  perData.type,
                  perData['totalHrZone0Second'],
                  perData['totalHrZone1Second'],
                  perData['totalHrZone2Second'],
                  perData['totalHrZone3Second'],
                  perData['totalHrZone4Second'],
                  perData['totalHrZone5Second'],
                  this.activitiesList[i].startTime.split('T')[0]
                ]);
              }
            }

            break;
        }
      }
    }

    const typeAllAvgTrainTime = (typeAllTotalTrainTime / this.hasDataNumber) || 0,
          typeRunAvgTrainTime = (typeRunTotalTrainTime / this.hasDataNumber) || 0,
          typeCycleAvgTrainTime = (typeCycleTotalTrainTime / this.hasDataNumber) || 0,
          typeWeightTrainAvgTrainTime = (typeWeightTrainTotalTrainTime / this.hasDataNumber) || 0,
          typeSwimAvgTrainTime = (typeSwimTotalTrainTime / this.hasDataNumber) || 0,
          typeAerobicAvgTrainTime = (typeAerobicTotalTrainTime / this.hasDataNumber) || 0,
          typeRowAvgTrainTime = (typeRowTotalTrainTime / this.hasDataNumber) || 0;

    const typeAllData = {
      activityLength: this.activityLength,
      totalTime: this.formatTime(typeAllTotalTrainTime),
      avgTime: this.formatTime(typeAllAvgTrainTime),
      distance: typeAllTotalDistance,
      weightKg: typeAllTotalWeight,
      HrZoneZero: typeAllHrZoneZero,
      HrZoneOne: typeAllHrZoneOne,
      HrZoneTwo: typeAllHrZoneTwo,
      HrZoneThree: typeAllHrZoneThree,
      HrZoneFour: typeAllHrZoneFour,
      HrZoneFive: typeAllHrZoneFive,
      perTypeLength: [typeRunLength, typeCycleLength, typeWeightTrainLength, typeSwimLength, typeAerobicLength, typeRowLength],
      perTypeTime: [
        typeRunAvgTrainTime,
        typeCycleAvgTrainTime,
        typeWeightTrainAvgTrainTime,
        typeSwimAvgTrainTime,
        typeAerobicAvgTrainTime,
        typeRowAvgTrainTime
      ],
      perHrZoneData: this.computeSameHRZoneData(typeAllHrZoneData),
      perCaloriesData: this.computeSameDayData(typeAllCalories, [], typeAllDataDate, 'calories'),
      typeList: typeList,
      perAvgHR: typeAllavgHr,
      perActivityTime: typeAllActivityTime
    };

    const typeRunData = {
      activityLength: typeRunLength,
      totalTime: this.formatTime(typeRunTotalTrainTime),
      avgTime: this.formatTime(typeRunAvgTrainTime),
      distance: typeRunTotalDistance,
      HrZoneZero: typeRunHrZoneZero,
      HrZoneOne: typeRunHrZoneOne,
      HrZoneTwo: typeRunHrZoneTwo,
      HrZoneThree: typeRunHrZoneThree,
      HrZoneFour: typeRunHrZoneFour,
      HrZoneFive: typeRunHrZoneFive,
      perHrZoneData: this.computeSameHRZoneData(typeRunHrZoneData),
      perCaloriesData: this.computeSameDayData(typeRunCalories, [], typeRunDataDate, 'calories'),
      perPaceData: this.computeSameDayPace(typeRunSpeed, typeRunMaxSpeed, typeRunDataDate, 1),
      perCadenceData: this.computeSameDayData(typeRunCadence, typeRunMaxCadence, typeRunDataDate, 'cadence'),
      perHRData: this.computeSameDayData(typeRunHR, typeRunMaxHR, typeRunDataDate, 'HR')
    };

    const typeCycleData = {
      activityLength: typeCycleLength,
      totalTime: this.formatTime(typeCycleTotalTrainTime),
      avgTime: this.formatTime(typeCycleAvgTrainTime),
      distance: typeCycleTotalDistance,
      HrZoneZero: typeCycleHrZoneZero,
      HrZoneOne: typeCycleHrZoneOne,
      HrZoneTwo: typeCycleHrZoneTwo,
      HrZoneThree: typeCycleHrZoneThree,
      HrZoneFour: typeCycleHrZoneFour,
      HrZoneFive: typeCycleHrZoneFive,
      perHrZoneData: this.computeSameHRZoneData(typeCycleHrZoneData),
      perCaloriesData: this.computeSameDayData(typeCycleCalories, [], typeCycleDataDate, 'calories'),
      perSpeedData: this.computeSameDayData(typeCycleSpeed, typeCycleMaxSpeed, typeCycleDataDate, 'speed'),
      perCadenceData: this.computeSameDayData(typeCycleCadence, typeCycleMaxCadence, typeCycleDataDate, 'cadence'),
      perHRData: this.computeSameDayData(typeCycleHR, typeCycleMaxHR, typeCycleDataDate, 'HR'),
      perPowerData: this.computeSameDayData(typeCyclePower, typeCycleMaxPower, typeCycleDataDate, 'power')
    };

    const typeWeightTrainData = {
      activityLength: typeWeightTrainLength,
      totalTime: this.formatTime(typeWeightTrainTotalTrainTime),
      avgTime: this.formatTime(typeWeightTrainAvgTrainTime),
      weightKg: typeWeightTrainTotalWeight,
      perCaloriesData: this.computeSameDayData(typeWeightTrainCalories, [], typeWeightTrainDataDate, 'calories')
    };

    const typeSwimData = {
      activityLength: typeSwimLength,
      totalTime: this.formatTime(typeSwimTotalTrainTime),
      avgTime: this.formatTime(typeSwimAvgTrainTime),
      distance: typeSwimTotalDistance,
      HrZoneZero: typeSwimHrZoneZero,
      HrZoneOne: typeSwimHrZoneOne,
      HrZoneTwo: typeSwimHrZoneTwo,
      HrZoneThree: typeSwimHrZoneThree,
      HrZoneFour: typeSwimHrZoneFour,
      HrZoneFive: typeSwimHrZoneFive,
      perHrZoneData: this.computeSameHRZoneData(typeSwimHrZoneData),
      perCaloriesData: this.computeSameDayData(typeSwimCalories, [], typeSwimDataDate, 'calories'),
      perPaceData: this.computeSameDayPace(typeSwimSpeed, typeSwimMaxSpeed, typeSwimDataDate, 4),
      perCadenceData: this.computeSameDayData(typeSwimCadence, typeSwimMaxCadence, typeSwimDataDate, 'cadence'),
      perSwolfData: this.computeSameDayData(typeSwimSwolf, typeSwimMaxSwolf, typeSwimDataDate, 'swolf'),
      perHRData: this.computeSameDayData(typeSwimHR, typeSwimMaxHR, typeSwimDataDate, 'HR')
    };

    const typeAerobicData = {
      activityLength: typeAerobicLength,
      totalTime: this.formatTime(typeAerobicTotalTrainTime),
      avgTime: this.formatTime(typeAerobicAvgTrainTime),
      HrZoneZero: typeAerobicHrZoneZero,
      HrZoneOne: typeAerobicHrZoneOne,
      HrZoneTwo: typeAerobicHrZoneTwo,
      HrZoneThree: typeAerobicHrZoneThree,
      HrZoneFour: typeAerobicHrZoneFour,
      HrZoneFive: typeAerobicHrZoneFive,
      perHrZoneData: this.computeSameHRZoneData(typeAerobicHrZoneData),
      perCaloriesData: this.computeSameDayData(typeAerobicCalories, [], typeAerobicDataDate, 'calories'),
      perHRData: this.computeSameDayData(typeAerobicHR, typeAerobicMaxHR, typeAerobicDataDate, 'HR')
    };

    const typeRowData = {
      activityLength: typeRowLength,
      totalTime: this.formatTime(typeRowTotalTrainTime),
      avgTime: this.formatTime(typeRowAvgTrainTime),
      distance: typeRowTotalDistance,
      HrZoneZero: typeRowHrZoneZero,
      HrZoneOne: typeRowHrZoneOne,
      HrZoneTwo: typeRowHrZoneTwo,
      HrZoneThree: typeRowHrZoneThree,
      HrZoneFour: typeRowHrZoneFour,
      HrZoneFive: typeRowHrZoneFive,
      perHrZoneData: this.computeSameHRZoneData(typeRowHrZoneData),
      perCaloriesData: this.computeSameDayData(typeRowCalories, [], typeRowDataDate, 'calories'),
      perPaceData: this.computeSameDayPace(typeRowSpeed, typeRowMaxSpeed, typeRowDataDate, 6),
      perCadenceData: this.computeSameDayData(typeRowCadence, typeRowMaxCadence, typeRowDataDate, 'cadence'),
      perHRData: this.computeSameDayData(typeRowHR, typeRowMaxHR, typeRowDataDate, 'HR'),
      perPowerData: this.computeSameDayData(typeRowPower, typeRowMaxPower, typeRowDataDate, 'power')
    };

    this.groupService.setTypeAllData(
      typeAllData,
      typeRunData,
      typeCycleData,
      typeWeightTrainData,
      typeSwimData,
      typeAerobicData,
      typeRowData,
    );
    this.isLoading = false;

    this.loadCategoryData(this.reportCategory);
  }

  // 使時間依照xxxx/XX/XX格式顯示-kidin-1090120
  formatTime (time: number) {
    const hour = Math.floor((time) / 3600);
    const minute = Math.floor((time % 3600) / 60);
    const second = time - (hour * 3600) - (minute * 60);
    if (hour === 0) {
      return `${this.fillTwoDigits(minute)}:${this.fillTwoDigits(second)}`;
    } else {
      return `${hour}:${this.fillTwoDigits(minute)}:${this.fillTwoDigits(second)}`;
    }
  }

  // 時間補零-kidin-1081211
  fillTwoDigits (num: number) {
    const timeStr = '0' + Math.floor(num);
    return timeStr.substr(-2);
  }

  // 根據運動類別使用rxjs從service取得資料-kidin-1090120
  loadCategoryData (type: string) {
    this.isRxjsLoading = true;
    this.groupService.getTypeData(type).subscribe(res => {
      this.categoryActivityLength = res.activityLength;
      if (this.categoryActivityLength === undefined || this.categoryActivityLength === 0) {
        this.nodata = true;
      } else {
        this.totalTime = res.totalTime;
        this.avgTime = res.avgTime;
        this.perTypeLength = res.perTypeLength;
        this.perTypeTime = res.perTypeTime;
        this.typeHrZone = [
          res.HrZoneZero,
          res.HrZoneOne,
          res.HrZoneTwo,
          res.HrZoneThree,
          res.HrZoneFour,
          res.HrZoneFive
        ];
        this.perHrZoneData = res.perHrZoneData;

        this.perCalories = res.perCaloriesData;
        this.totalCalories = res.perCaloriesData.totalCalories;
        this.bestCalories = res.perCaloriesData.oneRangeBestCalories;
        this.avgCalories = res.perCaloriesData.avgCalories;
        this.avgPersonCalories = res.perCaloriesData.avgPersonCalories;
        this.typeList = res.typeList;
        this.perAvgHR = res.perAvgHR;
        this.perActivityTime = res.perActivityTime;

        if (res.distance) {
          this.totalDistance = res.distance;
        }

        if (res.weightKg) {
          this.totalWeight = res.weightKg;
        }

        if (res.perSpeedData) {
          this.perSpeedData = res.perSpeedData;
          this.bestSpeed = res.perSpeedData.oneRangeBestSpeed;
          this.avgSpeed = res.perSpeedData.avgSpeed;
        }

        if (res.perPaceData) {
          this.perPaceData = res.perPaceData;
          this.bestPace = res.perPaceData.oneRangeBestPace;
          this.avgPace = res.perPaceData.avgPace;
        }

        if (res.perCadenceData) {
          this.perCadenceData = res.perCadenceData;
          this.bestCadence = res.perCadenceData.oneRangeBestCadence;
          this.avgCadence = res.perCadenceData.avgCadence;
        }

        if (res.perSwolfData) {
          this.perSwolfData = res.perSwolfData;
          this.bestSwolf = res.perSwolfData.oneRangeBestSwolf;
          this.avgSwolf = res.perSwolfData.avgSwolf;
        }

        if (res.perHRData) {
          this.perHRData = res.perHRData;
          this.bestHR = res.perHRData.oneRangeBestHR;
          this.avgHR = res.perHRData.avgHR;
        }

        if (res.perPowerData) {
          this.perPowerData = res.perPowerData;
          if (res.perPowerData.oneRangeBestPower !== null) {
            this.bestPower = res.perPowerData.oneRangeBestPower;
            this.avgPower = res.perPowerData.avgPower;
          } else {
            this.bestPower = 0;
            this.avgPower = 0;
          }
        }

        this.nodata = false;
      }
      this.isRxjsLoading = false;
      this.reportCompleted = true;
    });
  }

  // 刪除為0的數據並將相同日期的數據整合後計算配速-kidin-1090206
  computeSameDayPace (speed: Array<number>, maxSpeed: Array<number>, date: Array<string>, type: number) {
    const pace = [],
          bestPace = [],
          finalDate = [];
    let sameDaySpeed = 0,
        sameDayBestSpeed = 0,
        sameDayLength = 0,
        oneRangeBestSpeed = 0,
        totalSpeed = 0,
        timeStamp = 0;

    for (let i = 0; i < date.length; i++) {
      totalSpeed += speed[i];
      if (maxSpeed[i] > oneRangeBestSpeed) {
        oneRangeBestSpeed = maxSpeed[i];
      }

      if (i === 0 || date[i] === date[i - 1]) {
        sameDaySpeed += speed[i];
        sameDayLength++;
        if (maxSpeed[i] > sameDayBestSpeed) {
          sameDayBestSpeed = maxSpeed[i];
        }

        if (i === date.length - 1) {
          timeStamp = moment(date[i], 'YYYY-MM-DD').valueOf();
          finalDate.push(timeStamp);

          // 根據不同運動類別做配速計算-kidin-1090206
          switch (type) {
            case 1:  // 跑步
              pace.push((60 / (sameDaySpeed / sameDayLength)) * 60);
              bestPace.push((60 / maxSpeed[i]) * 60);
              break;
            case 4:  // 游泳
              pace.push((60 / (sameDaySpeed / sameDayLength)) * 60 / 10);
              bestPace.push((60 / maxSpeed[i]) * 60 / 10);
              break;
            case 6:  // 划船
              pace.push((60 / (sameDaySpeed / sameDayLength)) * 60 / 2);
              bestPace.push((60 / maxSpeed[i]) * 60 / 2);
              break;
          }
        }

      // 若數據日期變更，則將之前的數據整合並儲存後再重新計算新的日期數據-kidin-0190210
      } else if (i !== 0 && date[i] !== date[i - 1]) {
        timeStamp = moment(date[i], 'YYYY-MM-DD').valueOf();
        finalDate.push(timeStamp);

        // 根據不同運動類別做配速計算-kidin-1090206
        switch (type) {
          case 1:  // 跑步
            pace.push((60 / (sameDaySpeed / sameDayLength)) * 60);
            bestPace.push((60 / maxSpeed[i]) * 60);
            break;
          case 4:  // 游泳
            pace.push((60 / (sameDaySpeed / sameDayLength)) * 60 / 10);
            bestPace.push((60 / maxSpeed[i]) * 60 / 10);
            break;
          case 6:  // 划船
            pace.push((60 / (sameDaySpeed / sameDayLength)) * 60 / 2);
            bestPace.push((60 / maxSpeed[i]) * 60 / 2);
            break;
        }

        if (i !== date.length - 1) {
          sameDaySpeed = speed[i];
          sameDayBestSpeed = maxSpeed[i];
          sameDayLength = 1;
        } else {
          timeStamp = moment(date[i], 'YYYY-MM-DD').valueOf();
          finalDate.push(timeStamp);

          // 根據不同運動類別做配速計算-kidin-1090206
          switch (type) {
            case 1:  // 跑步
              pace.push((60 / (sameDaySpeed / sameDayLength)) * 60);
              bestPace.push((60 / maxSpeed[i]) * 60);
              break;
            case 4:  // 游泳
              pace.push((60 / (sameDaySpeed / sameDayLength)) * 60 / 10);
              bestPace.push((60 / maxSpeed[i]) * 60 / 10);
              break;
            case 6:  // 划船
              pace.push((60 / (sameDaySpeed / sameDayLength)) * 60 / 2);
              bestPace.push((60 / maxSpeed[i]) * 60 / 2);
              break;
          }
        }

      }
    }



    const perTypeBestPace = this.switchPace(oneRangeBestSpeed, type);
    const perTypeAvgPace = this.switchPace((totalSpeed / date.length), type);

    const colorSet = ['#6a4db8', '#e04c62', '#ffd451'];

    return {
      pace,
      bestPace,
      date: finalDate,
      colorSet,
      oneRangeBestPace: perTypeBestPace,
      avgPace: perTypeAvgPace
    };
  }

  // 配速換算-kidin-1090206
  switchPace (value, type) {
    let pace;
    switch (type) {
      case 1:
        pace = 60 / value * 60;
        break;
      case 4:
        pace = (60 / value * 60) / 10;
        break;
      case 6:
        pace = (60 / value * 60) / 2;
        break;
    }

    if (pace > 3600) {
      pace = 3600;
    }
    const yVal = pace,
          paceMin = Math.floor(yVal / 60),
          paceSec = Math.round(yVal - paceMin * 60),
          timeMin = ('0' + paceMin).slice(-2),
          timeSecond = ('0' + paceSec).slice(-2);

    if (timeMin === '00') {
      return `0'${timeSecond}`;
    } else {
      return `${timeMin}'${timeSecond}`;
    }
  }

  // 將日期相同的心率區間做整合並轉成highcharts所需的資料格式-kidin-1090325
  computeSameHRZoneData (data: Array<number>) {
    const finalData = {
        zoneZero: [],
        zoneOne: [],
        zoneTwo: [],
        zoneThree: [],
        zoneFour: [],
        zoneFive: []
      },
      sameDayData = {
        zoneZero: 0,
        zoneOne: 0,
        zoneTwo: 0,
        zoneThree: 0,
        zoneFour: 0,
        zoneFive: 0
      };

    for (let i = 0; i < data.length; i++) {

      if (i === 0 || data[i][7] === data[i - 1][7]) {
        sameDayData.zoneZero += data[i][1],
        sameDayData.zoneOne += data[i][2],
        sameDayData.zoneTwo += data[i][3],
        sameDayData.zoneThree += data[i][4],
        sameDayData.zoneFour += data[i][5],
        sameDayData.zoneFive += data[i][6];

        if (i === data.length - 1) {
          const timeStamp = moment(data[i][7], 'YYYY-MM-DD').valueOf();
          finalData.zoneZero.push([timeStamp, sameDayData.zoneZero]);
          finalData.zoneOne.push([timeStamp, sameDayData.zoneOne]);
          finalData.zoneTwo.push([timeStamp, sameDayData.zoneTwo]);
          finalData.zoneThree.push([timeStamp, sameDayData.zoneThree]);
          finalData.zoneFour.push([timeStamp, sameDayData.zoneFour]);
          finalData.zoneFive.push([timeStamp, sameDayData.zoneFive]);

        }
      } else {
        let timeStamp = moment(data[i - 1][7], 'YYYY-MM-DD').valueOf();
        finalData.zoneZero.push([timeStamp, sameDayData.zoneZero]);
        finalData.zoneOne.push([timeStamp, sameDayData.zoneOne]);
        finalData.zoneTwo.push([timeStamp, sameDayData.zoneTwo]);
        finalData.zoneThree.push([timeStamp, sameDayData.zoneThree]);
        finalData.zoneFour.push([timeStamp, sameDayData.zoneFour]);
        finalData.zoneFive.push([timeStamp, sameDayData.zoneFive]);

        if (i !== data.length - 1 ) {
          sameDayData.zoneZero = data[i][1],
          sameDayData.zoneOne = data[i][2],
          sameDayData.zoneTwo = data[i][3],
          sameDayData.zoneThree = data[i][4],
          sameDayData.zoneFour = data[i][5],
          sameDayData.zoneFive = data[i][6];
        } else {
          timeStamp = moment(data[i][7], 'YYYY-MM-DD').valueOf();
          finalData.zoneZero.push([timeStamp, data[i][1]]);
          finalData.zoneOne.push([timeStamp, data[i][2]]);
          finalData.zoneTwo.push([timeStamp, data[i][3]]);
          finalData.zoneThree.push([timeStamp, data[i][4]]);
          finalData.zoneFour.push([timeStamp, data[i][5]]);
          finalData.zoneFive.push([timeStamp, data[i][6]]);
        }

      }
    }

    return this.fillVacancyData(finalData, [], 'HRZone');
  }

  // 將日期相同的數據做整合-kidin-1090210
  computeSameDayData (data: Array<number>, bestData: Array<number>, date: Array<string>, type: string) {
    const finalDate = [],
          finalData = [];
    let sameDayData = 0,
        sameDayLength = 0,
        oneRangeBest = 0,
        total = 0;

    if (bestData.length !== 0) {
      const bestFinalData = [];
      let sameDayBestData = 0;

      for (let i = 0; i < date.length; i++) {
        total += data[i];
        if (bestData[i] > oneRangeBest) {
          oneRangeBest = bestData[i];
        }

        if (i === 0 || date[i] === date[i - 1]) {
          sameDayData += data[i];
          sameDayLength++;
          if (bestData[i] > sameDayBestData) {
            sameDayBestData = bestData[i];
          }

          if (i === date.length - 1) {
            finalData.push(sameDayData / sameDayLength);
            bestFinalData.push(sameDayBestData);
            finalDate.push(moment(date[i], 'YYYY-MM-DD').valueOf());
          }

        // 若數據日期變更，則將之前的數據整合並儲存後再重新計算新的日期數據-kidin-0190210
        } else if (i !== 0 && date[i] !== date[i - 1]) {
          finalData.push(sameDayData / sameDayLength);
          bestFinalData.push(sameDayBestData);
          finalDate.push(moment(date[i - 1], 'YYYY-MM-DD').valueOf());

          if (i !== date.length - 1) {
            sameDayData = data[i];
            sameDayBestData = bestData[i];
            sameDayLength = 1;
          } else {
            finalData.push(data[i]);
            bestFinalData.push(bestData[i]);
            finalDate.push(moment(date[i], 'YYYY-MM-DD').valueOf());
          }

        }
      }

      const perTypeAvg = total / finalDate.length;

      switch (type) {
        case 'calories':
          return {
            calories: this.fillVacancyData(finalData, finalDate, 'calories'),
            bestcalories: bestFinalData,
            date: this.chartTimeStamp,
            colorSet: ['#f8b551'],
            oneRangeBestCalories: oneRangeBest,
            avgCalories: total / date.length,
            avgPersonCalories: total / this.hasDataNumber,
            totalCalories: total
          };
        case 'cadence':
          return {
            cadence: finalData,
            bestCadence: bestFinalData,
            date: finalDate,
            colorSet: ['#aafc42', '#d6ff38', '#f56300'],
            oneRangeBestCadence: oneRangeBest,
            avgCadence: perTypeAvg
          };
        case 'heartRate':
          return {
            HR: finalData,
            bestHR: bestFinalData,
            date: finalDate,
            colorSet: ['#aafc42', '#d6ff38', '#f56300'],
            oneRangeBestHR: oneRangeBest,
            avgHR: perTypeAvg
          };
        case 'swolf':
          return {
            swolf: finalData,
            bestSwolf: bestFinalData,
            date: finalDate,
            colorSet: ['#aafc42', '#d6ff38', '#7fd9ff'],
            oneRangeBestSwolf: oneRangeBest,
            avgSwolf: perTypeAvg
          };
        case 'speed':
          return {
            speed: finalData,
            bestSpeed: bestFinalData,
            date: finalDate,
            colorSet: ['#ff00ff', '#ffff00', '#ffff00'],
            oneRangeBestSpeed: oneRangeBest,
            avgSpeed: perTypeAvg
          };
        case 'power':
          return {
            power: finalData,
            bestPower: bestFinalData,
            date: finalDate,
            colorSet: ['#aafc42', '#d6ff38', '#f56300'],
            oneRangeBestPower: oneRangeBest,
            avgPower: perTypeAvg
          };
        case 'HR':
          return {
            HR: finalData,
            bestHR: bestFinalData,
            date: finalDate,
            colorSet: [
              'rgb(70, 156, 245)',
              'rgb(64, 218, 232)',
              'rgb(86, 255, 0)',
              'rgb(214, 207, 1)',
              'rgb(234, 164, 4)',
              'rgba(243, 105, 83)'
            ],
            oneRangeBestHR: oneRangeBest,
            avgHR: perTypeAvg
          };
      }

    } else {
      for (let i = 0; i < date.length; i++) {
        total += data[i];

        if (i === 0 || date[i] === date[i - 1]) {
          sameDayData += data[i];
          sameDayLength++;

          if (i === date.length - 1) {

            if (sameDayData / sameDayLength > oneRangeBest) {
              oneRangeBest = sameDayData / sameDayLength;
            }

            finalData.push(sameDayData / sameDayLength);
            finalDate.push(moment(date[i], 'YYYY-MM-DD').valueOf());
          }

        // 若數據日期變更，則將之前的數據整合並儲存後再重新計算新的日期數據-kidin-0190210
        } else if (i !== 0 && date[i] !== date[i - 1]) {
          if (sameDayData / sameDayLength > oneRangeBest) {
            oneRangeBest = sameDayData / sameDayLength;
          }

          finalData.push(sameDayData / sameDayLength);
          finalDate.push(moment(date[i - 1], 'YYYY-MM-DD').valueOf());

          if (i !== date.length - 1) {
            sameDayData = data[i];
            sameDayLength = 1;
          } else {
            if (data[i] > oneRangeBest) {
              oneRangeBest = data[i];
            }

            finalData.push(data[i]);
            finalDate.push(moment(date[i], 'YYYY-MM-DD').valueOf());
          }

        }
      }

      // 有可能會追加計算其他類別的數據，故不寫死-kidin-1090210
      switch (type) {
        case 'calories':
          return {
            calories: this.fillVacancyData(finalData, finalDate, 'calories'),
            date: this.chartTimeStamp,
            colorSet: '#f8b551',
            oneRangeBestCalories: oneRangeBest,
            avgCalories: total / date.length,
            avgPersonCalories: total / this.hasDataNumber,
            totalCalories: total
          };
      }
    }
  }

  // 依據選取日期和報告類型（日/週）將缺漏的數值以0填補-kidin-1090324
  fillVacancyData (data, date, type) {
    switch (type) {
      case 'HRZone':
        if (data.zoneZero.length === 0) {
          return {
            zoneZero: [],
            zoneOne: [],
            zoneTwo: [],
            zoneThree: [],
            zoneFour: [],
            zoneFive: []
          };

        } else {
          let idx = 0;
          const newData = {
            zoneZero: [],
            zoneOne: [],
            zoneTwo: [],
            zoneThree: [],
            zoneFour: [],
            zoneFive: []
          };

          for (let i = 0; i < this.chartTimeStamp.length; i++) {

            if (idx >= data.zoneZero.length) {
              newData.zoneZero.push([this.chartTimeStamp[i], 0]);
              newData.zoneOne.push([this.chartTimeStamp[i], 0]);
              newData.zoneTwo.push([this.chartTimeStamp[i], 0]);
              newData.zoneThree.push([this.chartTimeStamp[i], 0]);
              newData.zoneFour.push([this.chartTimeStamp[i], 0]);
              newData.zoneFive.push([this.chartTimeStamp[i], 0]);
            } else if (this.chartTimeStamp[i] !== data.zoneZero[idx][0]) {
              newData.zoneZero.push([this.chartTimeStamp[i], 0]);
              newData.zoneOne.push([this.chartTimeStamp[i], 0]);
              newData.zoneTwo.push([this.chartTimeStamp[i], 0]);
              newData.zoneThree.push([this.chartTimeStamp[i], 0]);
              newData.zoneFour.push([this.chartTimeStamp[i], 0]);
              newData.zoneFive.push([this.chartTimeStamp[i], 0]);
            } else {
              newData.zoneZero.push([this.chartTimeStamp[i], data.zoneZero[idx][1]]);
              newData.zoneOne.push([this.chartTimeStamp[i], data.zoneOne[idx][1]]);
              newData.zoneTwo.push([this.chartTimeStamp[i], data.zoneTwo[idx][1]]);
              newData.zoneThree.push([this.chartTimeStamp[i], data.zoneThree[idx][1]]);
              newData.zoneFour.push([this.chartTimeStamp[i], data.zoneFour[idx][1]]);
              newData.zoneFive.push([this.chartTimeStamp[i], data.zoneFive[idx][1]]);
              idx++;
            }

          }

          return newData;
        }

      default:
        if (data.length === 0) {
          return [];
        } else {

          let idx = 0;
          const newData = [];

          for (let i = 0; i < this.chartTimeStamp.length; i++) {

            if (idx >= date.length) {
              newData.push(0);
            } else if (this.chartTimeStamp[i] !== date[idx]) {
              newData.push(0);
            } else {
              newData.push(data[idx]);
              idx++;
            }

          }

          return newData;
        }
    }

  }

  // 計算個人運動統計資料-kidin-1090302
  getPersonalStatistics (data, index) {

    if (data && data.length !== 0) {

      let totalActivityNum = 0,
            totalActivityTime = 0,
            totalCalories = 0,
            recordStartTime,
            idx = 1;

      const typeCount = [
              {type: 'run', count: 0},
              {type: 'cycle', count: 0},
              {type: 'weightTraining', count: 0},
              {type: 'swim', count: 0},
              {type: 'aerobic', count: 0},
              {type: 'row', count: 0}
            ],
            perHRZone = {
              z0: 0,
              z1: 0,
              z2: 0,
              z3: 0,
              z4: 0,
              z5: 0
            },
            xPoint = [],
            activityTime = [],
            calories = [];

      for (let i = 0; i < data.length; i++) {
        idx++;

        if (i === data.length - 1) {
          recordStartTime = moment(data[i].startTime.split('T')[0]);
        }

        let oneDayActivityTime = 0,
            oneDayCalories = 0;
        for (let j = 0; j < data[i].activities.length; j++) {
          const perData = data[i].activities[j];

          totalActivityNum += perData.totalActivities;
          totalActivityTime += +perData.totalSecond;
          totalCalories += perData.calories;
          perHRZone.z0 += perData.totalHrZone0Second;
          perHRZone.z1 += perData.totalHrZone1Second;
          perHRZone.z2 += perData.totalHrZone2Second;
          perHRZone.z3 += perData.totalHrZone3Second;
          perHRZone.z4 += perData.totalHrZone4Second;
          perHRZone.z5 += perData.totalHrZone5Second;

          oneDayActivityTime += +perData.totalSecond;
          oneDayCalories += perData.calories;

          switch (+perData.type) {
            case 1:
              typeCount[0].count += perData.totalActivities;
              break;
            case 2:
              typeCount[1].count += perData.totalActivities;
              break;
            case 3:
              typeCount[2].count += perData.totalActivities;
              break;
            case 4:
              typeCount[3].count += perData.totalActivities;
              break;
            case 5:
              typeCount[4].count += perData.totalActivities;
              break;
            case 6:
              typeCount[5].count += perData.totalActivities;
              break;
          }
        }

        activityTime.unshift(oneDayActivityTime);
        calories.unshift(oneDayCalories);
        xPoint.push(idx);
      }

      const recordEndTime = moment(this.selectDate.endDate.split('T')[0]),
            timeRegression = new SimpleLinearRegression(xPoint, activityTime),
            caloriesRegression = new SimpleLinearRegression(xPoint, calories);

      let timePeroid;
      if (this.dataDateRange === 'day') {
        timePeroid = this.diffDay;
      } else {
        timePeroid = recordEndTime.diff(recordStartTime, 'days');
      }

      return {
        id: index,
        name: this.groupList[index].name,
        userId: this.groupList[index].id,
        totalActivityNum: totalActivityNum,
        weekFrequency: (totalActivityNum / timePeroid) * 7,
        totalTime: this.formatHmTime(totalActivityTime),
        timeRegression: timeRegression.slope || 0,
        totalCalories: totalCalories,
        caloriesRegression: caloriesRegression.slope || 0,
        likeType: this.findLikeType(typeCount),
        HRZone: [
          perHRZone.z0,
          perHRZone.z1,
          perHRZone.z2,
          perHRZone.z3,
          perHRZone.z4,
          perHRZone.z5
        ]
      };

    } else {
      return {
        id: index,
        name: this.groupList[index].name,
        userId: this.groupList[index].id,
        totalActivityNum: '--',
        weekFrequency: '--',
        totalTime: '-:--',
        timeRegression: '--',
        totalCalories: '--',
        caloriesRegression: '--',
        likeType: [],
        HRZone: '--'
      };
    }

  }

  // 將秒數轉換成個人分析需要的時間格式-kidin-1090217
  formatHmTime (second) {
    if (second) {
      const totalSec = Math.round(second),
          hr = Math.floor(totalSec / 3600),
          min = Math.round((totalSec - hr * 3600) / 60);

      // 剛好59分30秒～59分59秒四捨五入後進位的情況-kidin-1090217
      if (min === 60) {
        return `${hr + 1}:00`;
      } else if (hr === 0 && min === 0) {
        return `0:00`;
      } else {
        const timeTotalMin = ('0' + min).slice(-2);
        return `${hr}:${timeTotalMin}`;
      }
    } else {
      return `-:--`;
    }

  }

  // 根據運動類型依運動檔案多寡進行排序，並取前三多的項目-kidin-1090309
  findLikeType (type) {
    const filterZero = type.filter(_type => {
      return (_type.count !== 0);
    });

    let swapped = true;
    for (let i = 0; i < filterZero.length && swapped; i++) {

      swapped = false;
      for (let j = 0; j < filterZero.length - 1 - i; j++) {
        if (filterZero[j].count < filterZero[j + 1].count) {
          swapped = true;
          [filterZero[j], filterZero[j + 1]] = [filterZero[j + 1], filterZero[j]];
        }
      }
    }

    if (filterZero.length > 3) {
      filterZero.length = 3;
    }

    const preference = filterZero.map(_item => {
      switch (_item.type) {
        case 'run':
          return 'icon-svg_web-icon_p1_083-run';
        case 'cycle':
          return 'icon-svg_web-icon_p1_084-cycle';
        case 'weightTraining':
          return 'icon-svg_web-icon_p1_086-weight_training';
        case 'swim':
          return 'icon-svg_web-icon_p1_085-swim';
        case 'aerobic':
          return 'icon-svg_web-icon_p1_087-aerobic';
        case 'row':
          return 'icon-svg_web-icon_p1_088-row';
      }
    });

    return preference;

  }

  // 將搜尋的類別和範圍處理過後加入query string並更新現在的url和預覽列印的url-kidin-1090205
  updateUrl (hasData) {
    let newUrl;
    if (hasData === 'true') {
      const startDateString = this.selectDate.startDate.split('T')[0],
            endDateString = this.selectDate.endDate.split('T')[0];
      let searchString;

      searchString =
        `startdate=${startDateString}&enddate=${endDateString}`;

      if (location.search.indexOf('?') > -1) {
        if (
          location.search.indexOf('startdate=') > -1 &&
          location.search.indexOf('enddate=') > -1
        ) {
          // 將舊的sr query string換成新的-kidin-1090205
          const preUrl = location.pathname;
          const queryString = location.search.replace('?', '').split('&');
          let newSufUrl = '';
          for (let i = 0; i < queryString.length; i++) {
            if (
              queryString[i].indexOf('startdate=') === -1 &&
              queryString[i].indexOf('enddate=') === -1
            ) {
              newSufUrl = `${newSufUrl}&${queryString[i]}`;
            }
          }
          newUrl = `${preUrl}?${searchString}${newSufUrl}`;
        } else {
          newUrl = location.pathname + location.search + `&${searchString}`;
        }
      } else {
        newUrl = location.pathname + `?${searchString}`;
      }
      this.previewUrl = newUrl + '&ipm=s';
    } else {
      newUrl = location.pathname;
    }

    /***待api支援debug mode-kidin-1090327
    if (history.pushState) {
      window.history.pushState({path: newUrl}, '', newUrl);
    }
    ***/
  }

  // 顯示群組資料-kidin-1090310
  showGroupInfo () {
    const groupIcon = this.groupData.groupIcon;
    this.groupImg =
      (
        groupIcon && groupIcon.length > 0
            ? groupIcon
            : '/assets/images/group-default.svg'
      );

    if (+this.groupLevel > 30 && this.groupData.groupRootInfo[2]) {
      const brandIcon = this.groupData.groupRootInfo[2].brandIcon;
      this.brandImg =
      (
        brandIcon && brandIcon.length > 0
            ? brandIcon
            : '/assets/images/group-default.svg'
      );

      this.brandName = this.groupData.groupRootInfo[2].brandName;
    }

    if (+this.groupLevel > 40 && this.groupData.groupRootInfo[3]) {
      this.branchName = this.groupData.groupRootInfo[3].branchName;
    }
  }

  // 切換運動類型-kidin-1090212
  changeSportCategory () {
    this.groupService.setReportCategory(this.reportCategory);
  }

  // 點擊運定項目後該類別相關資料特別顯示-kidin-1090214
  assignCategory (category) {
    if (category === this.selectType) {
      this.selectType = '99';
    } else {
      this.selectType = category;
    }
  }

  // 顯示所有個人分析列表-kidin-1090305
  showAllPersonData () {
    this.showAll = true;
    this.personalData.data = this.allPersonalData.slice();

    if (this.sortTable && this.sortTable.hasOwnProperty('active')) {
      this.sortPersonData();
    }
  }

  // 依據點選的項目進行排序-kidin-1090305
  sortPersonData () {
    const sortCategory = this.sortTable.active,
          sortDirection = this.sortTable.direction,
          sortResult = [...this.personalData.data];

    let swapped = true;

    for (let i = 0; i < sortResult.length && swapped; i++) {
      swapped = false;
      for (let j = 0; j < sortResult.length - 1 - i; j++) {
        if (sortDirection === 'asc') {

          if (sortCategory === 'totalTime' && sortResult[j][sortCategory] !== '-:--') {

            const sortA = this.timeStringSwitchNum(sortResult[j][sortCategory]),
                  sortB = this.timeStringSwitchNum(sortResult[j + 1][sortCategory]);

            if (sortA > sortB) {
              swapped = true;
              [sortResult[j], sortResult[j + 1]] = [sortResult[j + 1], sortResult[j]];
            }

          } else {

            if (sortResult[j][sortCategory] > sortResult[j + 1][sortCategory] || sortResult[j][sortCategory] === '--') {
              swapped = true;
              [sortResult[j], sortResult[j + 1]] = [sortResult[j + 1], sortResult[j]];
            }

          }

        } else {

          if (sortCategory === 'totalTime' && sortResult[j][sortCategory] !== '-:--') {
            const sortA = this.timeStringSwitchNum(sortResult[j][sortCategory]),
                  sortB = this.timeStringSwitchNum(sortResult[j + 1][sortCategory]);

            if (sortA < sortB) {
              swapped = true;
              [sortResult[j], sortResult[j + 1]] = [sortResult[j + 1], sortResult[j]];
            }

          } else {

            if (sortResult[j][sortCategory] < sortResult[j + 1][sortCategory] || sortResult[j][sortCategory] === '--') {
              swapped = true;
              [sortResult[j], sortResult[j + 1]] = [sortResult[j + 1], sortResult[j]];
            }

          }

        }

      }
    }

    this.personalData.data = sortResult;
  }

  // 依據點選的成員顯示選單-kidin-1090102
  handleClickMember (e) {
    this.checkClickEvent = true;
    const user = e.currentTarget.id,
          hashUserId = this.hashIdService.handleUserIdEncode(this.groupList[user].id);

    this.personalPage = {
      info: `/user-profile/${hashUserId}`,
      report: `/user-profile/${hashUserId}/sport-report`
    };

    if (e.view.innerWidth - e.clientX < 200) {
      this.personalMenu = {
        show: true,
        x: `${e.view.innerWidth - 200}px`,
        y: `${e.clientY}px`
      };
    } else {
      this.personalMenu = {
        show: true,
        x: `${e.clientX}px`,
        y: `${e.clientY}px`
      };
    }

    window.addEventListener('scroll', this.hideMenu.bind(this), true);
  }

  // 隱藏個人選單-kidin-1090310
  hideMenu () {
    if (this.checkClickEvent === false) {
      this.personalMenu = {
        show: false,
        x: '',
        y: ''
      };
    } else {
      this.checkClickEvent = false;
    }

    window.removeEventListener('scroll', this.hideMenu.bind(this), true);
  }

  // 將時間字串轉數字(分鐘)-kidin-1090401
  timeStringSwitchNum (time) {
    const min = (+time.split(':')[0] * 60) + +time.split(':')[1];
    return min;
  }

  print() {
    window.print();
  }

  // 離開頁面時將rxjs儲存的資料初始化-kidin-1090213
  ngOnDestroy () {
    this.showReport = false;

  }

}
