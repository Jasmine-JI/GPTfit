import { Component, OnInit, OnDestroy } from '@angular/core';
import * as moment from 'moment';
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

  // UI控制相關變數-kidin-1090115
  isLoading = false;
  isRxjsLoading = true;
  isPreviewMode = false;
  reportCompleted = true;
  initialChartComplated = false;
  nodata = false;
  dataDateRange = '';
  isSelected = 'rangeDate';
  isSelectDateRange = false;
  maxStartDate = moment().format('YYYY-MM-DD');
  minEndDate = moment().add(-13, 'days').format('YYYY-MM-DD');
  maxSelectDate = moment().format('YYYY-MM-DD');
  showReport = false;
  selectType = '99';

  // 資料儲存用變數-kidin-1090115
  token: string;
  groupLevel: string;
  groupId: string;
  groupData: any;
  groupList: Array<any>;
  groupImg: string;
  brandImg: string;
  brandName: string;
  branchName: string;
  startDate = '';
  endDate = moment().format('YYYY-MM-DD');
  selectedStartDate = moment().add(-13, 'days').format('YYYY-MM-DD');
  selectedEndDate = moment().format('YYYY-MM-DD');
  diffDay: number;
  reportCategory = '99';
  reportStartTime = '';
  reportEndTime = '';
  reportEndDate = '';
  period = '';
  reportStartDate = '';
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
  avgCalories = 0;
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

  // 圖表用數據-kidin-1090115
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
  ) { }

  ngOnInit() {
    this.token = this.utilsService.getToken();

    // 確認是否為預覽列印頁面-kidin-1090205
    if (location.search.indexOf('ipm=s') > -1) {
      this.isPreviewMode = true;
    }

    this.getIdListStart();

    // 使用rxjs訂閱運動類別使運動類別更改時可以即時切換-kidin-1090121
    this.groupService.getreportCategory().subscribe(res => {
      this.reportCategory = res;
      this.loadCategoryData(res);
    });
  }

  ngOnChanges () {}

  // 先從rxjs取得成員ID清單，若取不到再call api-kidin-1090211
  getIdListStart () {
    this.groupService.getMemberList().subscribe(res => {
      if (res.groupId === '' || res.groupId !== this.groupId) {
        // 先從service取得群組資訊，若取不到再call api-kidin-1081210
        this.groupService.getGroupInfo().subscribe(result => {
          this.groupData = result;
          if (this.groupData.hasOwnProperty('groupId')) {
            this.groupId = this.groupData.groupId;
            this.showGroupInfo();
          } else {
            const urlArr = location.pathname.split('/');
            this.groupId = this.hashIdService.handleGroupIdDecode(urlArr[urlArr.length - 2]);
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
      }
    });
  }

  // 取得所有成員id list並使用rxjs儲存至service-kidin-1090211
  getGroupMemberIdList() {
    this.groupLevel = this.utilsService.displayGroupLevel(this.groupId);
    const body = {
      token: this.token,
      groupId: this.groupId,
      groupLevel: this.groupLevel,
      infoType: 2,
      avatarType: 3
    };

    this.groupService.fetchGroupMemberList(body).subscribe(res => {
      const idList = new Set(),  // 避免id重複-kidin-1090211
            memberList = res.info.groupMemberInfo;

      for (let i = 0; i < memberList.length; i++) {
        if (memberList[i].accessRight >= 50) {
          idList.add(memberList[i].memberId);
        }
      }

      this.groupList = Array.from(idList);
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
      }
    });

  }

  // 依query string顯示資料-kidin-20191226
  queryStringShowData () {
    const queryString = location.search.replace('?', '').split('&');
    for (let i = 0; i < queryString.length; i++) {
      if (queryString[i].indexOf('startdate=') > -1) {
        this.selectedStartDate = queryString[i].replace('startdate=', '');
      } else if (queryString[i].indexOf('enddate=') > -1) {
        this.selectedEndDate = queryString[i].replace('enddate=', '');
      }
    }

    this.handleSubmitSearch('url');
  }

  // 按下日期按鈕後記錄其選擇並更改該按鈕樣式-kidin-1090211
  handleActivityBtn (e) {
    if (e.target.name === 'aWeek') {
      this.startDate = moment().add(-6, 'days').format('YYYY-MM-DD');
    } else if (e.target.name === 'aMonth') {
      this.startDate = moment().add(-29, 'days').format('YYYY-MM-DD');
    }
    this.isSelected = e.target.name;
    this.isSelectDateRange = false;
  }

  // 點擊選擇日期區間按鈕後，選擇日期顯示與否-kidin-1081209
  handleClickSelectDate (e) {
    this.isSelected = e.target.name;
    this.startDate = '';
    if (this.isSelectDateRange === false) {
      this.isSelectDateRange = true;
    } else {
      this.isSelectDateRange = false;
    }
  }

  // 使用者選擇日期區間後紀錄其開始日期-kidin-1081209
  handleStartDate (e) {
    this.selectedStartDate = e.target.value.format('YYYY-MM-DD');
    this.minEndDate = e.target.value;
  }

  // 使用者選擇日期區間後紀錄其結束日期-kidin-1081209
  handleEndDate (e) {
    this.selectedEndDate = e.target.value.format('YYYY-MM-DD');
    this.maxStartDate = e.target.value;
  }

  // 使用者送出表單後顯示相關資料-kidin-1081209
  handleSubmitSearch (act) {
    if (act === 'click') {
      this.updateUrl('false');
    }
    this.reportCompleted = false;
    this.getFilterTime();
    this.createReport();
  }

  // 取得當地時區並加以處理-kidin-1081210
  getFilterTime () {
    const timeZoneMinite = new Date();
    const timeZone = -(timeZoneMinite.getTimezoneOffset() / 60);
    let timeZoneStr = '';
    if (timeZone < 10 && timeZone >= 0) {
      timeZoneStr = `+0${timeZone}`;
    } else if (timeZone > 10) {
      timeZoneStr = `+${timeZone}`;
    } else if (timeZone > -10 && timeZone < 0) {
      timeZoneStr = `-0${timeZone}`;
    } else {
      timeZoneStr = `-${timeZone}`;
    }

    if (this.startDate === '') {
      this.reportStartTime = `${this.selectedStartDate}T00:00:00.000${timeZoneStr}:00`;
      this.reportEndTime = `${this.selectedEndDate}T23:59:59.000${timeZoneStr}:00`;

      this.reportEndDate = this.selectedEndDate;

      const startDay = moment(this.selectedStartDate),
            endDay = moment(this.selectedEndDate);
      this.diffDay = endDay.diff(startDay, 'days') + 1;
      this.period = `${this.diffDay}${this.translate.instant(
        'Dashboard.SportReport.day'
      )}`;
    } else {
      this.reportStartTime = `${this.startDate}T00:00:00.000${timeZoneStr}:00`;
      this.reportEndTime = `${this.endDate}T23:59:59.000${timeZoneStr}:00`;

      this.reportEndDate = this.endDate;

      const startDay = moment(this.startDate),
            endDay = moment(this.endDate);
      this.diffDay = endDay.diff(startDay, 'days') + 1;
      this.period = `${this.diffDay}${this.translate.instant(
        'Dashboard.SportReport.day'
      )}`;
    }
  }

  // 建立運動報告-kidin-1090117
  createReport () {
    this.isLoading = true;

    this.initVariable();

    // 52天內取日概要陣列，52天以上取周概要陣列-kidin_1090211
    if (this.diffDay <= 52) {
      this.reportRangeType = 1;
      this.dataDateRange = 'day';
    } else {
      this.reportRangeType = 2;
      this.dataDateRange = 'week';
    }

    const body = {
      token: this.token || '',
      type: this.reportRangeType,
      targetUserId: this.groupList,
      filterStartTime: this.reportStartTime,
      filterEndTime: this.reportEndTime
    };

    this.reportService.fetchSportSummaryArray(body).subscribe(res => {
      if (Array.isArray(res)) {
        let groupReportData = [];
        for (let j = 0; j < res.length; j++) {
          // 計算有資料的人數，並將資料合併-kidin-1090212
          if (this.reportRangeType === 1) {
            if (res[j].reportActivityDays && res[j].reportActivityDays.length > 0) {
              this.hasDataNumber++;
              groupReportData = groupReportData.concat(res[j].reportActivityDays);
            }
          } else {
            if (res[j].reportActivityWeeks && res[j].reportActivityWeeks.length > 0) {
              this.hasDataNumber++;
              groupReportData = groupReportData.concat(res[j].reportActivityWeeks);
            }
          }
        }

        // 若沒有任何運動數據則顯示無資料-kidin-1090212
        if (this.hasDataNumber === 0) {
          this.nodata = true;
          this.isLoading = false;
          this.updateUrl('false');
        } else {
          this.nodata = false;
          this.showReport = true;
          this.isSelectDateRange = false;
          this.updateUrl('true');
          this.sortData(groupReportData);
          this.calPerCategoryData();
        }
      } else {
        console.log('Sever Error');
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
    this.totalCalories = 0;
    this.groupService.setTypeAllData({}, {}, {}, {}, {}, {}, {});
    this.perHrZoneData = [];
    this.perTypeLength = [];
    this.perTypeTime = [];
    this.typeHrZone = [];
    this.perDate = [];
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
      this.activityLength += +this.activitiesList[i].activities[0]['totalActivities'];
      typeAllTotalTrainTime += +this.activitiesList[i].activities[0]['totalSecond'];
      typeList.push(this.activitiesList[i].activities[0]['type']);
      typeAllCalories.push(this.activitiesList[i].activities[0]['calories']);
      typeAllDataDate.push(this.activitiesList[i].startTime.split('T')[0]);
      typeAllavgHr.push(this.activitiesList[i].activities[0]['avgHeartRateBpm']);
      typeAllActivityTime.push(
        this.activitiesList[i].activities[0]['totalSecond'] / this.activitiesList[i].activities[0]['totalActivities']
      );

      // 確認是否有距離數據-kidin-1090204
      if (this.activitiesList[i].activities[0]['totalDistanceMeters']) {
        typeAllTotalDistance += this.activitiesList[i].activities[0]['totalDistanceMeters'];
      }

      // 確認是否有重量數據-kidin-1090204
      if (this.activitiesList[i].activities[0]['totalWeightKg']) {
        typeAllTotalWeight += this.activitiesList[i].activities[0]['totalWeightKg'];
      }

      // 活動成效分佈圖和心率區間趨勢用資料-kidin-1090203
      if (this.activitiesList[i].activities[0]['totalHrZone0Second'] !== null) {
        typeAllHrZoneZero += this.activitiesList[i].activities[0]['totalHrZone0Second'];
        typeAllHrZoneOne += this.activitiesList[i].activities[0]['totalHrZone1Second'];
        typeAllHrZoneTwo += this.activitiesList[i].activities[0]['totalHrZone2Second'];
        typeAllHrZoneThree += this.activitiesList[i].activities[0]['totalHrZone3Second'];
        typeAllHrZoneFour += this.activitiesList[i].activities[0]['totalHrZone4Second'];
        typeAllHrZoneFive += this.activitiesList[i].activities[0]['totalHrZone5Second'];
        if (
          this.activitiesList[i].activities[0]['totalHrZone0Second'] +
          this.activitiesList[i].activities[0]['totalHrZone1Second'] +
          this.activitiesList[i].activities[0]['totalHrZone2Second'] +
          this.activitiesList[i].activities[0]['totalHrZone3Second'] +
          this.activitiesList[i].activities[0]['totalHrZone4Second'] +
          this.activitiesList[i].activities[0]['totalHrZone5Second'] !== 0
        ) {
          typeAllHrZoneData.push([
            this.activitiesList[i].activities[0].type,
            this.activitiesList[i].activities[0]['totalHrZone0Second'],
            this.activitiesList[i].activities[0]['totalHrZone1Second'],
            this.activitiesList[i].activities[0]['totalHrZone2Second'],
            this.activitiesList[i].activities[0]['totalHrZone3Second'],
            this.activitiesList[i].activities[0]['totalHrZone4Second'],
            this.activitiesList[i].activities[0]['totalHrZone5Second'],
            this.activitiesList[i].startTime.split('T')[0]
          ]);
        }
      }

      // 根據不同類別計算數據-kidin-1090204
      switch (this.activitiesList[i].activities[0].type) {
        case '1':
          typeRunLength += +this.activitiesList[i].activities[0]['totalActivities'];
          typeRunTotalTrainTime += +this.activitiesList[i].activities[0]['totalSecond'];
          typeRunCalories.push(this.activitiesList[i].activities[0]['calories']);
          typeRunTotalDistance += this.activitiesList[i].activities[0]['totalDistanceMeters'];
          typeRunDataDate.push(this.activitiesList[i].startTime.split('T')[0]);
          typeRunSpeed.push(this.activitiesList[i].activities[0]['avgSpeed']);
          typeRunMaxSpeed.push(this.activitiesList[i].activities[0]['avgMaxSpeed']);
          typeRunCadence.push(this.activitiesList[i].activities[0]['runAvgCadence']);
          typeRunMaxCadence.push(this.activitiesList[i].activities[0]['avgRunMaxCadence']);
          typeRunHR.push(this.activitiesList[i].activities[0]['avgHeartRateBpm']);
          typeRunMaxHR.push(this.activitiesList[i].activities[0]['avgMaxHeartRateBpm']);


          // 確認是否有心率數據-kidin-1090204
          if (this.activitiesList[i].activities[0]['totalHrZone0Second'] !== null) {
            typeRunHrZoneZero += this.activitiesList[i].activities[0]['totalHrZone0Second'];
            typeRunHrZoneOne += this.activitiesList[i].activities[0]['totalHrZone1Second'];
            typeRunHrZoneTwo += this.activitiesList[i].activities[0]['totalHrZone2Second'];
            typeRunHrZoneThree += this.activitiesList[i].activities[0]['totalHrZone3Second'];
            typeRunHrZoneFour += this.activitiesList[i].activities[0]['totalHrZone4Second'];
            typeRunHrZoneFive += this.activitiesList[i].activities[0]['totalHrZone5Second'];
            if (
              this.activitiesList[i].activities[0]['totalHrZone0Second'] +
              this.activitiesList[i].activities[0]['totalHrZone1Second'] +
              this.activitiesList[i].activities[0]['totalHrZone2Second'] +
              this.activitiesList[i].activities[0]['totalHrZone3Second'] +
              this.activitiesList[i].activities[0]['totalHrZone4Second'] +
              this.activitiesList[i].activities[0]['totalHrZone5Second'] !== 0
            ) {
              typeRunHrZoneData.push([
                this.activitiesList[i].activities[0].type,
                this.activitiesList[i].activities[0]['totalHrZone0Second'],
                this.activitiesList[i].activities[0]['totalHrZone1Second'],
                this.activitiesList[i].activities[0]['totalHrZone2Second'],
                this.activitiesList[i].activities[0]['totalHrZone3Second'],
                this.activitiesList[i].activities[0]['totalHrZone4Second'],
                this.activitiesList[i].activities[0]['totalHrZone5Second'],
                this.activitiesList[i].startTime.split('T')[0]
              ]);
            }
          }

          break;
        case '2':
          typeCycleLength += +this.activitiesList[i].activities[0]['totalActivities'];
          typeCycleTotalTrainTime += +this.activitiesList[i].activities[0]['totalSecond'];
          typeCycleCalories.push(this.activitiesList[i].activities[0]['calories']);
          typeCycleTotalDistance += this.activitiesList[i].activities[0]['totalDistanceMeters'];
          typeCycleDataDate.push(this.activitiesList[i].startTime.split('T')[0]);
          typeCycleSpeed.push(this.activitiesList[i].activities[0]['avgSpeed']);
          typeCycleMaxSpeed.push(this.activitiesList[i].activities[0]['avgMaxSpeed']);
          typeCycleCadence.push(this.activitiesList[i].activities[0]['cycleAvgCadence']);
          typeCycleMaxCadence.push(this.activitiesList[i].activities[0]['avgCycleMaxCadence']);
          typeCycleHR.push(this.activitiesList[i].activities[0]['avgHeartRateBpm']);
          typeCycleMaxHR.push(this.activitiesList[i].activities[0]['avgMaxHeartRateBpm']);
          typeCyclePower.push(this.activitiesList[i].activities[0]['cycleAvgWatt']);
          typeCycleMaxPower.push(this.activitiesList[i].activities[0]['avgCycleMaxWatt']);

          if (this.activitiesList[i].activities[0]['totalHrZone0Second'] !== null) {
            typeCycleHrZoneZero += this.activitiesList[i].activities[0]['totalHrZone0Second'];
            typeCycleHrZoneOne += this.activitiesList[i].activities[0]['totalHrZone1Second'];
            typeCycleHrZoneTwo += this.activitiesList[i].activities[0]['totalHrZone2Second'];
            typeCycleHrZoneThree += this.activitiesList[i].activities[0]['totalHrZone3Second'];
            typeCycleHrZoneFour += this.activitiesList[i].activities[0]['totalHrZone4Second'];
            typeCycleHrZoneFive += this.activitiesList[i].activities[0]['totalHrZone5Second'];
            if (
              this.activitiesList[i].activities[0]['totalHrZone0Second'] +
              this.activitiesList[i].activities[0]['totalHrZone1Second'] +
              this.activitiesList[i].activities[0]['totalHrZone2Second'] +
              this.activitiesList[i].activities[0]['totalHrZone3Second'] +
              this.activitiesList[i].activities[0]['totalHrZone4Second'] +
              this.activitiesList[i].activities[0]['totalHrZone5Second'] !== 0
            ) {
              typeCycleHrZoneData.push([
                this.activitiesList[i].activities[0].type,
                this.activitiesList[i].activities[0]['totalHrZone0Second'],
                this.activitiesList[i].activities[0]['totalHrZone1Second'],
                this.activitiesList[i].activities[0]['totalHrZone2Second'],
                this.activitiesList[i].activities[0]['totalHrZone3Second'],
                this.activitiesList[i].activities[0]['totalHrZone4Second'],
                this.activitiesList[i].activities[0]['totalHrZone5Second'],
                this.activitiesList[i].startTime.split('T')[0]
              ]);
            }
          }

          break;
        case '3':
          typeWeightTrainLength += +this.activitiesList[i].activities[0]['totalActivities'];
          typeWeightTrainTotalTrainTime += +this.activitiesList[i].activities[0]['totalSecond'];
          typeWeightTrainCalories.push(this.activitiesList[i].activities[0]['calories']);
          typeWeightTrainTotalWeight += this.activitiesList[i].activities[0]['totalWeightKg'];
          typeWeightTrainDataDate.push(this.activitiesList[i].startTime.split('T')[0]);

          break;
        case '4':
          typeSwimLength += +this.activitiesList[i].activities[0]['totalActivities'];
          typeSwimTotalTrainTime += +this.activitiesList[i].activities[0]['totalSecond'];
          typeSwimCalories.push(this.activitiesList[i].activities[0]['calories']);
          typeSwimTotalDistance += this.activitiesList[i].activities[0]['totalDistanceMeters'];
          typeSwimDataDate.push(this.activitiesList[i].startTime.split('T')[0]);
          typeSwimSpeed.push(this.activitiesList[i].activities[0]['avgSpeed']);
          typeSwimMaxSpeed.push(this.activitiesList[i].activities[0]['avgMaxSpeed']);
          typeSwimCadence.push(this.activitiesList[i].activities[0]['swimAvgCadence']);
          typeSwimMaxCadence.push(this.activitiesList[i].activities[0]['avgSwimMaxCadence']);
          typeSwimSwolf.push(this.activitiesList[i].activities[0]['avgSwolf']);
          typeSwimMaxSwolf.push(this.activitiesList[i].activities[0]['bestSwolf']);
          typeSwimHR.push(this.activitiesList[i].activities[0]['avgHeartRateBpm']);
          typeSwimMaxHR.push(this.activitiesList[i].activities[0]['avgMaxHeartRateBpm']);

          if (this.activitiesList[i].activities[0]['totalHrZone0Second'] !== null) {
            typeSwimHrZoneZero += this.activitiesList[i].activities[0]['totalHrZone0Second'];
            typeSwimHrZoneOne += this.activitiesList[i].activities[0]['totalHrZone1Second'];
            typeSwimHrZoneTwo += this.activitiesList[i].activities[0]['totalHrZone2Second'];
            typeSwimHrZoneThree += this.activitiesList[i].activities[0]['totalHrZone3Second'];
            typeSwimHrZoneFour += this.activitiesList[i].activities[0]['totalHrZone4Second'];
            typeSwimHrZoneFive += this.activitiesList[i].activities[0]['totalHrZone5Second'];
            if (
              this.activitiesList[i].activities[0]['totalHrZone0Second'] +
              this.activitiesList[i].activities[0]['totalHrZone1Second'] +
              this.activitiesList[i].activities[0]['totalHrZone2Second'] +
              this.activitiesList[i].activities[0]['totalHrZone3Second'] +
              this.activitiesList[i].activities[0]['totalHrZone4Second'] +
              this.activitiesList[i].activities[0]['totalHrZone5Second'] !== 0
            ) {
              typeSwimHrZoneData.push([
                this.activitiesList[i].activities[0].type,
                this.activitiesList[i].activities[0]['totalHrZone0Second'],
                this.activitiesList[i].activities[0]['totalHrZone1Second'],
                this.activitiesList[i].activities[0]['totalHrZone2Second'],
                this.activitiesList[i].activities[0]['totalHrZone3Second'],
                this.activitiesList[i].activities[0]['totalHrZone4Second'],
                this.activitiesList[i].activities[0]['totalHrZone5Second'],
                this.activitiesList[i].startTime.split('T')[0]
              ]);
            }
          }

          break;
        case '5':
          typeAerobicLength += +this.activitiesList[i].activities[0]['totalActivities'];
          typeAerobicTotalTrainTime += +this.activitiesList[i].activities[0]['totalSecond'];
          typeAerobicCalories.push(this.activitiesList[i].activities[0]['calories']);
          typeAerobicDataDate.push(this.activitiesList[i].startTime.split('T')[0]);
          typeAerobicHR.push(this.activitiesList[i].activities[0]['avgHeartRateBpm']);
          typeAerobicMaxHR.push(this.activitiesList[i].activities[0]['avgMaxHeartRateBpm']);

          if (this.activitiesList[i].activities[0]['totalHrZone0Second'] !== null) {
            typeAerobicHrZoneZero += this.activitiesList[i].activities[0]['totalHrZone0Second'];
            typeAerobicHrZoneOne += this.activitiesList[i].activities[0]['totalHrZone1Second'];
            typeAerobicHrZoneTwo += this.activitiesList[i].activities[0]['totalHrZone2Second'];
            typeAerobicHrZoneThree += this.activitiesList[i].activities[0]['totalHrZone3Second'];
            typeAerobicHrZoneFour += this.activitiesList[i].activities[0]['totalHrZone4Second'];
            typeAerobicHrZoneFive += this.activitiesList[i].activities[0]['totalHrZone5Second'];
            if (
              this.activitiesList[i].activities[0]['totalHrZone0Second'] +
              this.activitiesList[i].activities[0]['totalHrZone1Second'] +
              this.activitiesList[i].activities[0]['totalHrZone2Second'] +
              this.activitiesList[i].activities[0]['totalHrZone3Second'] +
              this.activitiesList[i].activities[0]['totalHrZone4Second'] +
              this.activitiesList[i].activities[0]['totalHrZone5Second'] !== 0
            ) {
              typeAerobicHrZoneData.push([
                this.activitiesList[i].activities[0].type,
                this.activitiesList[i].activities[0]['totalHrZone0Second'],
                this.activitiesList[i].activities[0]['totalHrZone1Second'],
                this.activitiesList[i].activities[0]['totalHrZone2Second'],
                this.activitiesList[i].activities[0]['totalHrZone3Second'],
                this.activitiesList[i].activities[0]['totalHrZone4Second'],
                this.activitiesList[i].activities[0]['totalHrZone5Second'],
                this.activitiesList[i].startTime.split('T')[0]
              ]);
            }
          }

          break;
        case '6':
          typeRowLength += +this.activitiesList[i].activities[0]['totalActivities'];
          typeRowTotalTrainTime += +this.activitiesList[i].activities[0]['totalSecond'];
          typeRowCalories.push(this.activitiesList[i].activities[0]['calories']);
          typeRowTotalDistance += this.activitiesList[i].activities[0]['totalDistanceMeters'];
          typeRowDataDate.push(this.activitiesList[i].startTime.split('T')[0]);
          typeRowSpeed.push(this.activitiesList[i].activities[0]['avgSpeed']);
          typeRowMaxSpeed.push(this.activitiesList[i].activities[0]['avgMaxSpeed']);
          typeRowCadence.push(this.activitiesList[i].activities[0]['rowingAvgCadence']);
          typeRowMaxCadence.push(this.activitiesList[i].activities[0]['avgRowingMaxCadence']);
          typeRowHR.push(this.activitiesList[i].activities[0]['avgHeartRateBpm']);
          typeRowMaxHR.push(this.activitiesList[i].activities[0]['avgMaxHeartRateBpm']);
          typeRowPower.push(this.activitiesList[i].activities[0]['rowingAvgWatt']);
          typeRowMaxPower.push(this.activitiesList[i].activities[0]['rowingMaxWatt']);

          if (this.activitiesList[i].activities[0]['totalHrZone0Second'] !== null) {
            typeRowHrZoneZero += this.activitiesList[i].activities[0]['totalHrZone0Second'];
            typeRowHrZoneOne += this.activitiesList[i].activities[0]['totalHrZone1Second'];
            typeRowHrZoneTwo += this.activitiesList[i].activities[0]['totalHrZone2Second'];
            typeRowHrZoneThree += this.activitiesList[i].activities[0]['totalHrZone3Second'];
            typeRowHrZoneFour += this.activitiesList[i].activities[0]['totalHrZone4Second'];
            typeRowHrZoneFive += this.activitiesList[i].activities[0]['totalHrZone5Second'];
            if (
              this.activitiesList[i].activities[0]['totalHrZone0Second'] +
              this.activitiesList[i].activities[0]['totalHrZone1Second'] +
              this.activitiesList[i].activities[0]['totalHrZone2Second'] +
              this.activitiesList[i].activities[0]['totalHrZone3Second'] +
              this.activitiesList[i].activities[0]['totalHrZone4Second'] +
              this.activitiesList[i].activities[0]['totalHrZone5Second'] !== 0
            ) {
              typeRowHrZoneData.push([
                this.activitiesList[i].activities[0].type,
                this.activitiesList[i].activities[0]['totalHrZone0Second'],
                this.activitiesList[i].activities[0]['totalHrZone1Second'],
                this.activitiesList[i].activities[0]['totalHrZone2Second'],
                this.activitiesList[i].activities[0]['totalHrZone3Second'],
                this.activitiesList[i].activities[0]['totalHrZone4Second'],
                this.activitiesList[i].activities[0]['totalHrZone5Second'],
                this.activitiesList[i].startTime.split('T')[0]
              ]);
            }
          }

          break;
      }
    }

    const typeAllAvgTrainTime = (typeAllTotalTrainTime / this.activityLength) || 0,
          typeRunAvgTrainTime = (typeRunTotalTrainTime / typeRunLength) || 0,
          typeCycleAvgTrainTime = (typeCycleTotalTrainTime / typeCycleLength) || 0,
          typeWeightTrainAvgTrainTime = (typeWeightTrainTotalTrainTime / typeWeightTrainLength) || 0,
          typeSwimAvgTrainTime = (typeSwimTotalTrainTime / typeSwimLength) || 0,
          typeAerobicAvgTrainTime = (typeAerobicTotalTrainTime / typeAerobicLength) || 0,
          typeRowAvgTrainTime = (typeRowTotalTrainTime / typeRowLength) || 0;

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
      perHrZoneData: typeAllHrZoneData,
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
      perHrZoneData: typeRunHrZoneData,
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
      perHrZoneData: typeCycleHrZoneData,
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
      perHrZoneData: typeSwimHrZoneData,
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
      perHrZoneData: typeAerobicHrZoneData,
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
      perHrZoneData: typeRowHrZoneData,
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
            calories: finalData,
            bestcalories: bestFinalData,
            date: finalDate,
            colorSet: ['#f8b551'],
            oneRangeBestCalories: oneRangeBest,
            avgCalories: total / date.length,
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
        case 'calories':
          return {
            calories: finalData,
            bestCalories: bestFinalData,
            date: finalDate,
            colorSet: ['#f8b551'],
            oneRangeBestCalories: oneRangeBest,
            avgCalories: perTypeAvg
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
            calories: finalData,
            date: finalDate,
            colorSet: '#f8b551',
            oneRangeBestCalories: oneRangeBest,
            avgCalories: total / date.length,
            totalCalories: total
          };
      }
    }
  }

  // 將搜尋的類別和範圍處理過後加入query string並更新現在的url和預覽列印的url-kidin-1090205
  updateUrl (hasData) {
    let newUrl;
    if (hasData === 'true') {
      const startDateString = this.reportStartTime.split('T')[0],
            endDateString = this.reportEndTime.split('T')[0];
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

    if (history.pushState) {
      window.history.pushState({path: newUrl}, '', newUrl);
    }
  }

  // 顯示群組資料-kidin-1081227
  showGroupInfo () {
    const groupIcon = this.groupData.groupIcon;
      const brandIcon = this.groupData.groupRootInfo[2].brandIcon;
      this.groupImg =
        (
          groupIcon && groupIcon.length > 0
              ? groupIcon
              : '/assets/images/group-default.svg'
        );
      this.brandImg =
        (
          brandIcon && brandIcon.length > 0
              ? brandIcon
              : '/assets/images/group-default.svg'
        );
      this.brandName = this.groupData.groupRootInfo[2].brandName;
      this.branchName = this.groupData.groupRootInfo[3].branchName;
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

  print() {
    window.print();
  }

  // 離開頁面時將rxjs儲存的資料初始化-kidin-1090213
  ngOnDestroy () {
    this.showReport = false;
  }

}
