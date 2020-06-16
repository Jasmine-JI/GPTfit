import { Component, OnInit, ViewChild } from '@angular/core';
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
  selector: 'app-com-life-tracking',
  templateUrl: './com-life-tracking.component.html',
  styleUrls: ['./com-life-tracking.component.scss']
})
export class ComLifeTrackingComponent implements OnInit {

  @ViewChild('sortTable')
  sortTable: MatSort;

  // UI控制相關變數-kidin-1090115
  isLoading = false;
  isPreviewMode = false;
  reportCompleted = true;
  initialChartComplated = false;
  nodata = false;
  noStepData = true;
  noHRData = true;
  noSleepData = true;
  noConstituteData = true;
  noFitTimeData = true;
  dataDateRange = '';
  showReport = false;
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
  reportEndDate = '';
  period = '';
  reportRangeType = 1;
  reportCreatedTime = moment().format('YYYY/MM/DD HH:mm');
  previewUrl = '';

  infoData = {
    totalPeople: 0,
    validStroke: 0,
    avgHeight: 0,
    avgWeight: 0,
    avgAge: 0,
    avgFFMI: 0
  };

  recordData = {
    avgStep: 0,
    avgDistance: 0,
    stepReachReps: 0,
    avgMaxHR: 0,
    avgRestHR: 0,
    avgSleepTime: '',
    avgDeepSleepTime: '',
    avgLightSleepTime: ''
  };

  trendData = {
    bestFitTime: 0,
    avgFitTime: 0
  };

  sortResultData = [];
  personalData = new MatTableDataSource<any>();
  allPersonalData = [];
  personalPage = {
    info: '',
    report: ''
  };

  // 圖表用數據-kidin-1090215
  chartTimeStamp = [];
  searchDate = [];
  stepData = {
    stepList: [],
    targetStepList: [],
    date: [],
    colorSet: ['#6fd205', '#7f7f7f', '#eb5293']
  };

  HRData = {
    maxHRList: [],
    restHRList: [],
    date: [],
    colorSet: ['#e23333', '#31df93', '#ababab']
  };

  sleepData = {
    totalSleepList: [],
    deepSleepList: [],
    lightSleepList: [],
    awakeList: [],
    date: []
  };

  weightData = {
    weightList: [],
    colorSet: [
      [0, '#7ee33a'],
      [0.5, 'yellow'],
      [1, 'red']
    ]
  };

  constituteData = {
    fatRateList: [],
    fatRateColorSet: [
      [0, '#e0a63a'],
      [1, '#e04fc4']
    ],
    muscleRateList: [],
    muscleRateColorSet: [
      [0, '#3ae5da'],
      [1, '#299fc6']
    ]
  };

  FFMIData = {
    perFatRate: [],
    perFFMI: [],
    gender: []
  };

  fitTimeData = {
    fitTimeList: [],
    date: [],
    colorSet: '#f8b551'
  };

  constructor(
    private route: ActivatedRoute,
    private utilsService: UtilsService,
    private hashIdService: HashIdService,
    private reportService: ReportService,
    private translate: TranslateService,
    private groupService: GroupService
  ) {
    document.addEventListener('click', this.hideMenu.bind(this));
  }

  ngOnInit() {
    this.token = this.utilsService.getToken() || '';

    // 確認是否為預覽列印頁面-kidin-1090205
    if (location.search.indexOf('ipm=s') > -1) {
      this.isPreviewMode = true;
      this.getIdListStart();
    }

    this.personalData.sort = this.sortTable;
  }

  // 先從rxjs取得成員ID清單，若取不到再call api-kidin-1090215
  getIdListStart () {
    const hashGroupId = this.route.snapshot.paramMap.get('groupId');

    this.groupId = this.hashIdService.handleGroupIdDecode(hashGroupId);
    this.groupLevel = this.utilsService.displayGroupLevel(this.groupId);

    this.groupService.getMemberList().pipe(first()).subscribe(res => {
      if (res.groupId === '' || res.groupId !== this.groupId) {
        // 先從service取得群組資訊，若取不到再call api-kidin-1090215
        this.groupService.getGroupInfo().pipe(first()).subscribe(result => {
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
        this.groupService.getGroupInfo().pipe(first()).subscribe(result => {
          this.groupData = result;
          this.showGroupInfo();
        });

        this.handleSubmitSearch('click');
      }
    });
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

      // 確認網址是否帶有query string-kidin-1090215
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

  // 依query string顯示資料-kidin-1090215
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

  // 使用者送出表單後顯示相關資料-kidin-1090215
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
    this.infoData.totalPeople = this.groupList.length;

    // 52天內取日概要陣列，52天以上取周概要陣列-kidin_1090215
    if (this.diffDay <= 52) {
      this.reportRangeType = 1;
      this.dataDateRange = 'day';
    } else {
      this.reportRangeType = 2;
      this.dataDateRange = 'week';
    }

    this.createTimeStampArr(this.diffDay);

    const groupIdList = [];
    for (let i = 0; i < this.groupList.length; i++) {
      groupIdList.push(this.groupList[i].id);
    }

    const body = {
      token: this.token || '',
      type: this.reportRangeType,
      targetUserId: groupIdList,
      filterStartTime: this.selectDate.startDate,
      filterEndTime: this.selectDate.endDate
    };

    this.reportService.fetchTrackingSummaryArray(body).subscribe(res => {
      if (Array.isArray(res)) {
        this.reportEndDate = moment(this.selectDate.endDate.split('T')[0]).format('YYYY/MM/DD');
        this.reportCompleted = false;

        const currentYear = moment().year();

        let groupReportData = [],
            totalHeight = 0,
            validHeightStroke = 0,
            totalWeight = 0,
            validWeightStroke = 0,
            totalAge = 0,
            validAgeStroke = 0,
            totalFFMI = 0,
            validFFMIStroke = 0;

        for (let i = 0; i < res.length; i++) {

          // 確認隱私權有無開放-kidin-1090215
          if (+res[i].resultCode === 200) {
            let lifeTrackingData;

            if (this.reportRangeType === 1) {
              lifeTrackingData = res[i].reportLifeTrackingDays;
            } else {
              lifeTrackingData = res[i].reportLifeTrackingWeeks;
            }

            this.allPersonalData.push(this.getPersonalStatistics(lifeTrackingData, i));

            if (lifeTrackingData.length !== 0) {
              groupReportData = groupReportData.concat(lifeTrackingData);
              this.infoData.validStroke += lifeTrackingData.length;

              const heightList = [],
                    weightList = [],
                    avgList = [],
                    muscleRateList = [],
                    fatRateList = [],
                    FFMI = [];
              for (let j = 0; j < lifeTrackingData.length; j++) {

                if (lifeTrackingData[j].bodyHeight !== null) {
                  heightList.unshift(lifeTrackingData[j].bodyHeight);
                }

                weightList.unshift([
                  moment(lifeTrackingData[j].startTime.split('T')[0], 'YYYY-MM-DD').valueOf(),
                  lifeTrackingData[j].bodyWeight
                ]);

                if (lifeTrackingData[j].birthYear !== null) {
                  avgList.unshift(+currentYear - +lifeTrackingData[j].birthYear);
                }

                if (lifeTrackingData[j].muscleRate !== null && lifeTrackingData[j].muscleRate !== 0) {
                  // FFMI＝〔體重（Kg）×（100％－體脂率）〕÷ 身高2（m）-kidin-1090215
                  muscleRateList.unshift([
                    moment(lifeTrackingData[j].startTime.split('T')[0], 'YYYY-MM-DD').valueOf(),
                    lifeTrackingData[j].muscleRate
                  ]);

                  fatRateList.unshift([
                    moment(lifeTrackingData[j].startTime.split('T')[0], 'YYYY-MM-DD').valueOf(),
                    lifeTrackingData[j].fatRate
                  ]);

                  const height = lifeTrackingData[j].bodyHeight / 100,
                        weight = lifeTrackingData[j].bodyWeight,
                        fatRate = lifeTrackingData[j].fatRate,
                        countFFMI = (weight * ((100 - fatRate) / 100)) / Math.pow(height, 2);
                  FFMI.unshift(countFFMI);
                }
              }

              // 取該日期區間最新的身體數據-kidin-1090215
              totalHeight += heightList[heightList.length - 1];
              validHeightStroke++;
              totalWeight += weightList[weightList.length - 1][1];
              validWeightStroke++;
              totalAge += avgList[avgList.length - 1];
              validAgeStroke++;

              if (FFMI.length !== 0) {
                totalFFMI += FFMI[FFMI.length - 1];
                validFFMIStroke++;
              }

              const fillWeightData = this.fillVacancyData(weightList);
              this.weightData.weightList.push(fillWeightData);

              if (fatRateList.length !== 0) {
                this.noConstituteData = false;

                const fillmuscleRateData = this.fillVacancyData(muscleRateList);
                this.constituteData.muscleRateList.push(fillmuscleRateData);

                const fillfatRateData = this.fillVacancyData(fatRateList);
                this.constituteData.fatRateList.push(fillfatRateData);
                this.FFMIData.perFatRate.push(fatRateList[fatRateList.length - 1][1]);
                this.FFMIData.perFFMI.push(FFMI[FFMI.length - 1]);
                this.FFMIData.gender.push(lifeTrackingData[lifeTrackingData.length - 1].gender);
              }

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
        if (groupReportData.length === 0) {
          this.nodata = true;
          this.updateUrl('false');
        } else {
          this.nodata = false;
          this.showReport = true;
          this.updateUrl('true');
          this.sortData(groupReportData);
          this.calData(this.sortResultData);
        }

        this.infoData.avgHeight = totalHeight / validHeightStroke;
        this.infoData.avgWeight = totalWeight / validWeightStroke;
        this.infoData.avgAge = totalAge / validAgeStroke;
        this.infoData.avgFFMI = totalFFMI / validFFMIStroke;
        this.reportCompleted = true;
        this.isLoading = false;

      } else {
        this.nodata = true;
        this.isLoading = false;
        this.updateUrl('false');
        this.reportCompleted = true;
      }
    });
  }

  // 初始化變數-kidin-1090215
  initVariable () {
    if (this.sortTable && this.sortTable.hasOwnProperty('active')) {
      this.sortTable.sort({id: '', start: 'asc', disableClear: false});
      delete this.sortTable['active'];
    }

    this.noStepData = true;
    this.noHRData = true;
    this.noSleepData = true;
    this.noConstituteData = true;
    this.noFitTimeData = true;

    this.infoData = {
      totalPeople: 0,
      validStroke: 0,
      avgHeight: 0,
      avgWeight: 0,
      avgAge: 0,
      avgFFMI: 0
    };

    this.recordData.stepReachReps = 0;

    this.stepData = {
      stepList: [],
      targetStepList: [],
      date: [],
      colorSet: ['#6fd205', '#7f7f7f', '#eb5293']
    };

    this.HRData = {
      maxHRList: [],
      restHRList: [],
      date: [],
      colorSet: ['#e23333', '#31df93', '#ababab']
    };

    this.sleepData = {
      totalSleepList: [],
      deepSleepList: [],
      lightSleepList: [],
      awakeList: [],
      date: []
    };

    this.weightData = {
      weightList: [],
      colorSet: [
        [0, '#7ee33a'],
        [0.5, 'yellow'],
        [1, 'red']
      ]
    };

    this.constituteData = {
      fatRateList: [],
      fatRateColorSet: [
        [0, '#e0a63a'],
        [1, '#e04fc4']
      ],
      muscleRateList: [],
      muscleRateColorSet: [
        [0, '#3ae5da'],
        [1, '#299fc6']
      ]
    };

    this.FFMIData = {
      perFatRate: [],
      perFFMI: [],
      gender: []
    };

    this.fitTimeData = {
      fitTimeList: [],
      date: [],
      colorSet: '#f8b551'
    };

    this.personalData.data.length = 0;
    this.allPersonalData = [];
    this.chartTimeStamp = [];
  }

  // 建立報告期間的timeStamp讓圖表使用-kidin-1090312
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

  // 根據搜索時間取得周報告第一周的開始日期和週數-kidin-1090312
  findDate () {

    const week = {
      startDate: 0,
      weekNum: 0
    };

    let weekEndDate;

    // 周報告開頭是星期日-kidin-1090312
    if (moment(this.searchDate[0]).isoWeekday() !== 7) {
      week.startDate = this.searchDate[0] - 86400 * 1000 * moment(this.searchDate[0]).isoWeekday();
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

  // 依據選取日期和報告類型（日/週）將缺漏的數值以其他日期現有數值填補-kidin-1090313
  fillVacancyData (data) {
    if (data.length === 0) {
      return [];
    } else {

      let idx = 0;
      const newData = [];

      for (let i = 0; i < this.chartTimeStamp.length; i++) {

        if (idx >= data.length) {
          newData.push([this.chartTimeStamp[i], data[data.length - 1][1]]);
        } else if (this.chartTimeStamp[i] !== data[idx][0]) {
          newData.push([this.chartTimeStamp[i], data[idx][1]]);
        } else {
          newData.push(data[idx]);
          idx++;
        }

      }

      return newData;
    }
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

    this.sortResultData = sortResult;
  }

  // 計算頁面所需數據-kidin-1090215
  calData (sortData) {

    const step = {
      totalSteps: 0,
      totalDistance: 0,
      totalLength: 0,
      sameTimesStep: 0,
      sameTimesTargetStep: 0,
      sameTimesLength: 0,
      sameTimesDate: ''
    },

    HR = {
      totalMaxHR: 0,
      totalRestHR: 0,
      totalLength: 0,
      sameTimesMaxHR: 0,
      sameTimesRestHR: 0,
      sameTimesLength: 0,
      sameTimesDate: ''
    },

    sleep = {
      totalSleepTime: 0,
      totalDeepSleepTime: 0,
      totalLightSleepTime: 0,
      totalLength: 0,
      sameTimesTotalSleepTime: 0,
      sameTimesDeepSleepTime: 0,
      sameTimesLightSleepTime: 0,
      sameTimesAwakeTime: 0,
      sameTimesLength: 0,
      sameTimesDate: ''
    },

    fitTime = {
      totalFitTime: 0,
      totalLength: 0,
      sameTimesFitTime: 0,
      sameTimesLength: 0,
      sameTimesDate: '',
      bestFitTime: 0
    };

    for (let i = 0; i < sortData.length; i++) {

      // 將相同日期的步數數據做整合-kidin-1090217
      if (sortData[i].totalStep !== 0 && sortData[i].totalStep !== null) {
        this.noStepData = false;
        step.totalSteps += sortData[i].totalStep;
        step.totalDistance += sortData[i].totalDistanceMeters;
        step.totalLength++;

        if (step.sameTimesStep === 0 || sortData[i].startTime === step.sameTimesDate) {
          step.sameTimesStep += sortData[i].totalStep;
          step.sameTimesLength++;
          step.sameTimesDate = sortData[i].startTime;

          // 周報告目標步數不能小於35000-kidin-1090219
          if (this.dataDateRange === 'week' && sortData[i].targetStep < 5000 * 7) {
            step.sameTimesTargetStep += 5000 * 7;
          } else {
            step.sameTimesTargetStep += sortData[i].targetStep;
          }

          if (i === sortData.length - 1) {
            this.stepData.stepList.push(step.sameTimesStep / step.sameTimesLength);
            this.stepData.targetStepList.push(step.sameTimesTargetStep / step.sameTimesLength);
            this.stepData.date.push(moment(step.sameTimesDate.split('T')[0], 'YYYY-MM-DD').valueOf());
            step.sameTimesLength = 0;

            if (step.sameTimesStep >= step.sameTimesTargetStep) {
              this.recordData.stepReachReps++;
            }
          }
        } else if (step.sameTimesStep !== 0 && sortData[i].startTime !== step.sameTimesDate) {
          this.stepData.stepList.push(step.sameTimesStep / step.sameTimesLength);
          this.stepData.targetStepList.push(step.sameTimesTargetStep / step.sameTimesLength);
          this.stepData.date.push(moment(step.sameTimesDate.split('T')[0], 'YYYY-MM-DD').valueOf());
          step.sameTimesLength = 0;

          if (step.sameTimesStep >= step.sameTimesTargetStep) {
            this.recordData.stepReachReps++;
          }

          if (i !== sortData.length - 1) {
            step.sameTimesStep = sortData[i].totalStep;
            step.sameTimesLength = 1;
            step.sameTimesDate = sortData[i].startTime;

            // 周報告目標步數不能小於35000-kidin-1090219
            if (this.dataDateRange === 'week' && sortData[i].targetStep < 5000 * 7) {
              step.sameTimesTargetStep = 5000 * 7;
            } else {
              step.sameTimesTargetStep = sortData[i].targetStep;
            }
          } else {
            this.stepData.stepList.push(sortData[i].totalStep);
            this.stepData.targetStepList.push(sortData[i].targetStep);
            this.stepData.date.push(moment(sortData[i].startTime.split('T')[0], 'YYYY-MM-DD').valueOf());
            step.sameTimesLength = 0;

            if (sortData[i].totalStep >= sortData[i].targetStep) {
              this.recordData.stepReachReps++;
            }

            // 周報告目標步數不能小於35000-kidin-1090219
            if (this.dataDateRange === 'week' && sortData[i].targetStep < 5000 * 7) {
              this.stepData.targetStepList.push(5000 * 7);
            } else {
              this.stepData.targetStepList.push(sortData[i].targetStep);
            }
          }
        }
      }

      // 將相同日期的心率數據做整合-kidin-1090217
      if ((sortData[i].maxHeartRate !== 0 || sortData[i].restHeartRate !== 0) && sortData[i].restHeartRate !== null) {
        this.noHRData = false;
        HR.totalRestHR += sortData[i].restHeartRate;
        HR.totalMaxHR += sortData[i].maxHeartRate;
        HR.totalLength++;

        if (HR.sameTimesRestHR === 0 || sortData[i].startTime === HR.sameTimesDate) {
          HR.sameTimesRestHR += sortData[i].restHeartRate;
          HR.sameTimesMaxHR += sortData[i].maxHeartRate;
          HR.sameTimesLength++;
          HR.sameTimesDate = sortData[i].startTime;

          if (i === sortData.length - 1) {
            this.HRData.restHRList.push(HR.sameTimesRestHR / HR.sameTimesLength);
            this.HRData.maxHRList.push(HR.sameTimesMaxHR / HR.sameTimesLength);
            this.HRData.date.push(moment(HR.sameTimesDate.split('T')[0], 'YYYY-MM-DD').valueOf());
            HR.sameTimesLength = 0;
          }
        } else if (HR.sameTimesRestHR !== 0 && sortData[i].startTime !== HR.sameTimesDate) {
          this.HRData.restHRList.push(HR.sameTimesRestHR / HR.sameTimesLength);
          this.HRData.maxHRList.push(HR.sameTimesMaxHR / HR.sameTimesLength);
          this.HRData.date.push(moment(HR.sameTimesDate.split('T')[0], 'YYYY-MM-DD').valueOf());
          HR.sameTimesLength = 0;

          if (i !== sortData.length - 1) {
            HR.sameTimesRestHR = sortData[i].restHeartRate;
            HR.sameTimesMaxHR = sortData[i].maxHeartRate;
            HR.sameTimesLength = 1;
            HR.sameTimesDate = sortData[i].startTime;
          } else {
            this.HRData.restHRList.push(sortData[i].restHeartRate);
            this.HRData.maxHRList.push(sortData[i].maxHeartRate);
            this.HRData.date.push(moment(sortData[i].startTime.split('T')[0], 'YYYY-MM-DD').valueOf());
            HR.sameTimesLength = 0;
          }
        }
      }

      // 將相同日期的睡眠時間數據做整合-kidin-1090217
      if (sortData[i].totalSleepSecond !== 0 && sortData[i].totalSleepSecond !== null) {
        this.noSleepData = false;
        sleep.totalSleepTime += sortData[i].totalSleepSecond;
        sleep.totalLength++;

        if (sortData[i].totalDeepSecond !== null && sortData[i].totalLightSecond !== null) {
          sleep.totalDeepSleepTime += sortData[i].totalDeepSecond;
          sleep.totalLightSleepTime += sortData[i].totalLightSecond;
        }

        if (sleep.sameTimesTotalSleepTime === 0 || sortData[i].startTime === sleep.sameTimesDate) {
          sleep.sameTimesTotalSleepTime += sortData[i].totalSleepSecond;
          sleep.sameTimesLength++;
          sleep.sameTimesDate = sortData[i].startTime;

          if (sortData[i].totalDeepSecond !== null && sortData[i].totalLightSecond !== null) {
            sleep.sameTimesDeepSleepTime += sortData[i].totalDeepSecond;
            sleep.sameTimesLightSleepTime += sortData[i].totalLightSecond;
          }

          if (i === sortData.length - 1) {
            this.sleepData.totalSleepList.push(sleep.sameTimesTotalSleepTime / sleep.sameTimesLength);
            this.sleepData.deepSleepList.push(sleep.sameTimesDeepSleepTime / sleep.sameTimesLength);
            this.sleepData.lightSleepList.push(sleep.sameTimesLightSleepTime / sleep.sameTimesLength);
            sleep.sameTimesAwakeTime =
              sleep.sameTimesTotalSleepTime - sleep.sameTimesDeepSleepTime - sleep.sameTimesLightSleepTime;
            this.sleepData.awakeList.push(sleep.sameTimesAwakeTime / sleep.sameTimesLength);
            this.sleepData.date.push(moment(sleep.sameTimesDate.split('T')[0], 'YYYY-MM-DD').valueOf());
          }
        } else if (sortData[i].startTime !== sleep.sameTimesDate) {
          this.sleepData.totalSleepList.push(sleep.sameTimesTotalSleepTime / sleep.sameTimesLength);
          this.sleepData.deepSleepList.push(sleep.sameTimesDeepSleepTime / sleep.sameTimesLength);
          this.sleepData.lightSleepList.push(sleep.sameTimesLightSleepTime / sleep.sameTimesLength);
          sleep.sameTimesAwakeTime =
            sleep.sameTimesTotalSleepTime - sleep.sameTimesDeepSleepTime - sleep.sameTimesLightSleepTime;
          this.sleepData.awakeList.push(sleep.sameTimesAwakeTime / sleep.sameTimesLength);
          this.sleepData.date.push(moment(sleep.sameTimesDate.split('T')[0], 'YYYY-MM-DD').valueOf());

          if (i !== sortData.length - 1) {
            sleep.sameTimesTotalSleepTime = sortData[i].totalSleepSecond;
            sleep.sameTimesLength = 1;
            sleep.sameTimesDate = sortData[i].startTime;

            if (sortData[i].totalDeepSecond !== null && sortData[i].totalLightSecond !== null) {
              sleep.sameTimesDeepSleepTime = sortData[i].totalDeepSecond;
              sleep.sameTimesLightSleepTime = sortData[i].totalLightSecond;
            }

          } else {
            this.sleepData.totalSleepList.push(sortData[i].totalSleepSecond);
            this.sleepData.deepSleepList.push(sortData[i].totalDeepSecond);
            this.sleepData.lightSleepList.push(sortData[i].totalLightSecond);
            this.sleepData.awakeList.push(
              sortData[i].totalSleepSecond - sortData[i].totalDeepSecond - sortData[i].totalLightSecond
              );
            this.sleepData.date.push(moment(sortData[i].startTime.split('T')[0], 'YYYY-MM-DD').valueOf());
            sleep.sameTimesLength = 0;
          }
        }

      }

      // 將相同日期的燃脂時間數據做整合-kidin-1090217
      if (sortData[i].totalFitSecond !== 0  && sortData[i].totalFitSecond !== null) {
        this.noFitTimeData = false;
        fitTime.totalFitTime += sortData[i].totalFitSecond;
        fitTime.totalLength++;

        if (fitTime.sameTimesFitTime === 0 || sortData[i].startTime === fitTime.sameTimesDate) {
          fitTime.sameTimesFitTime += sortData[i].totalFitSecond;
          fitTime.sameTimesLength++;
          fitTime.sameTimesDate = sortData[i].startTime;

          if (i === sortData.length - 1) {

            if (fitTime.sameTimesFitTime / fitTime.sameTimesLength > fitTime.bestFitTime) {
              fitTime.bestFitTime = fitTime.sameTimesFitTime / fitTime.sameTimesLength;
            }

            this.fitTimeData.fitTimeList.push(fitTime.sameTimesFitTime / fitTime.sameTimesLength);
            this.fitTimeData.date.push(moment(fitTime.sameTimesDate.split('T')[0], 'YYYY-MM-DD').valueOf());
            fitTime.sameTimesLength = 0;
          }
        } else if (fitTime.sameTimesFitTime !== 0 && sortData[i].startTime !== fitTime.sameTimesDate) {

          if (fitTime.sameTimesFitTime / fitTime.sameTimesLength > fitTime.bestFitTime) {
            fitTime.bestFitTime = fitTime.sameTimesFitTime / fitTime.sameTimesLength;
          }

          this.fitTimeData.fitTimeList.push(fitTime.sameTimesFitTime / fitTime.sameTimesLength);
          this.fitTimeData.date.push(moment(fitTime.sameTimesDate.split('T')[0], 'YYYY-MM-DD').valueOf());
          fitTime.sameTimesLength = 0;

          if (i !== sortData.length - 1) {
            fitTime.sameTimesFitTime = sortData[i].totalFitSecond;
            fitTime.sameTimesLength = 1;
            fitTime.sameTimesDate = sortData[i].startTime;
          } else {

            if (sortData[i].totalFitSecond > fitTime.bestFitTime) {
              fitTime.bestFitTime = sortData[i].totalFitSecond;
            }

            this.fitTimeData.fitTimeList.push(sortData[i].totalFitSecond);
            this.fitTimeData.date.push(moment(sortData[i].startTime.split('T')[0], 'YYYY-MM-DD').valueOf());
            fitTime.sameTimesLength = 0;
          }
        }
      }

    }

    // 若有相同日期的數據在迴圈跑完後沒有儲存起來，則在此補上-kidin-1090217
    if (step.sameTimesLength !== 0) {
      this.stepData.stepList.push(step.sameTimesStep / step.sameTimesLength);
      this.stepData.targetStepList.push(step.sameTimesTargetStep / step.sameTimesLength);
      this.stepData.date.push(moment(step.sameTimesDate.split('T')[0], 'YYYY-MM-DD').valueOf());

      if (step.sameTimesStep >= step.sameTimesTargetStep) {
        this.recordData.stepReachReps++;
      }
    }

    if (HR.sameTimesLength !== 0) {
      this.HRData.restHRList.push(HR.sameTimesRestHR / HR.sameTimesLength);
      this.HRData.maxHRList.push(HR.sameTimesMaxHR / HR.sameTimesLength);
      this.HRData.date.push(moment(HR.sameTimesDate.split('T')[0], 'YYYY-MM-DD').valueOf());
    }

    if (sleep.sameTimesLength !== 0) {
      this.sleepData.totalSleepList.push(sleep.sameTimesTotalSleepTime / sleep.sameTimesLength);
      this.sleepData.deepSleepList.push(sleep.sameTimesDeepSleepTime / sleep.sameTimesLength);
      this.sleepData.lightSleepList.push(sleep.sameTimesLightSleepTime / sleep.sameTimesLength);
      this.sleepData.awakeList.push(
        (sleep.sameTimesTotalSleepTime - sleep.sameTimesDeepSleepTime - sleep.sameTimesLightSleepTime) / sleep.sameTimesLength
        );
      this.sleepData.date.push(moment(sleep.sameTimesDate.split('T')[0], 'YYYY-MM-DD').valueOf());
    }

    if (fitTime.sameTimesLength !== 0) {
      this.fitTimeData.fitTimeList.push(fitTime.sameTimesFitTime / fitTime.sameTimesLength);
      this.fitTimeData.date.push(moment(fitTime.sameTimesDate.split('T')[0], 'YYYY-MM-DD').valueOf());
    }

    this.recordData.avgStep = (step.totalSteps / step.totalLength);
    this.recordData.avgDistance = (step.totalDistance / step.totalLength);
    this.recordData.avgMaxHR = HR.totalMaxHR / HR.totalLength;
    this.recordData.avgRestHR = HR.totalRestHR / HR.totalLength;
    this.recordData.avgSleepTime = this.formatTime(sleep.totalSleepTime / sleep.totalLength);
    this.recordData.avgDeepSleepTime = this.formatTime(sleep.totalDeepSleepTime / sleep.totalLength || 0);
    this.recordData.avgLightSleepTime = this.formatTime(sleep.totalLightSleepTime / sleep.totalLength || 0);

    this.trendData.bestFitTime = fitTime.bestFitTime / 60;
    this.trendData.avgFitTime = (fitTime.totalFitTime / fitTime.totalLength) / 60;

  }

  // 計算個人生活追蹤統計資料-kidin-1090302
  getPersonalStatistics (data, index) {
    if (data.length !== 0) {

      let totalStep = 0,
          haveStepTimes = 0,
          totalSleepTime = 0,
          haveSleepTimes = 0,
          idx = 1;

      const step = [],
            stepXPoint = [],
            restHR = [],
            restHRXPoint = [],
            weight = [],
            weightXPoint = [],
            fatRateData = [],
            FFMIData = [];

      for (let i = 0; i < data.length; i++) {
        idx++;

        if (data[i].totalStep !== 0 && data[i].totalStep !== null) {
          totalStep += data[i].totalStep;
          step.unshift(data[i].totalStep);
          stepXPoint.push(idx);
          haveStepTimes++;
        }

        if (data[i].totalSleepSecond !== 0 && data[i].totalSleepSecond !== null) {
          totalSleepTime += data[i].totalSleepSecond;
          haveSleepTimes++;
        }

        if (data[i].restHeartRate !== null && data[i].restHeartRate !== 0) {
          restHR.unshift(data[i].restHeartRate);
          restHRXPoint.push(idx);
        }

        if (data[i].bodyWeight !== null && data[i].bodyWeight !== 0) {
          weight.unshift(data[i].bodyWeight);
          weightXPoint.push(idx);
        }

        if (data[i].fatRate !== null && data[i].fatRate !== 0) {
          fatRateData.unshift(data[i].fatRate);
          const w = data[i].bodyWeight,
                h = data[i].bodyHeight,
                f = data[i].fatRate;
          FFMIData.unshift((w * (100 - f) / 100) / Math.pow((h / 100), 2));
        }
      }

      const age = moment().year() - +data[0].birthYear;

      const stepRegression = new SimpleLinearRegression(stepXPoint, step),
            restHRRegression = new SimpleLinearRegression(restHRXPoint, restHR),
            weightRegression = new SimpleLinearRegression(weightXPoint, weight);

      return {
        id: index,
        name: this.groupList[index].name,
        avgStep: totalStep / haveStepTimes || '--',
        avgSleep: this.formatTime(totalSleepTime / haveSleepTimes),
        restHR: restHR[restHR.length - 1] || '--',
        weight: weight[weight.length - 1] || '--',
        fatRate: fatRateData[fatRateData.length - 1] || '--',
        fatRateComment: this.getFatRateComment(fatRateData[fatRateData.length - 1], data[0].gender, age),
        FFMIComment: this.getFFMIComment(fatRateData[fatRateData.length - 1], FFMIData[FFMIData.length - 1], data[0].gender) || '--',
        stepRegression: stepRegression.slope || 0,
        restHRRegression: restHRRegression.slope || 0,
        weightRegression: weightRegression.slope || 0
      };

    } else {
      return {
        id: index,
        name: this.groupList[index].name,
        avgStep: '--',
        avgSleep: '-:--',
        restHR: '--',
        weight: '--',
        fatRate: '--',
        fatRateComment: {
          comment: '',
          color: ''
        },
        FFMIComment: '--',
        stepRegression: '--',
        restHRRegression: '--',
        weightRegression: '--'
      };
    }
  }

  // 取得體脂肪評語-kidin-1090302
  getFatRateComment (fatRate, gender, age) {
    let boundary;
    if (gender === 0) {
      if (age < 30) {
        boundary = [14, 20];
      } else {
        boundary = [17, 25];
      }
    } else {
      if (age < 30) {
        boundary = [17, 25];
      } else {
        boundary = [20, 30];
      }
    }

    if (fatRate < boundary[0] && fatRate > 0) {
      return {
        comment: this.translate.instant('other.low'),
        color: '#2398c3'
      };
    } else if (fatRate < boundary[1] && fatRate >= boundary[0]) {
      return {
        comment: this.translate.instant('other.Standard'),
        color: '#5bbb26'
      };
    } else if (fatRate >= boundary[1]) {
      return {
        comment: this.translate.instant('other.high'),
        color: '#ffae00'
      };
    } else {
      return {
        comment: '',
        color: ''
      };
    }
  }

  // 取得FFMI評語-kidin-1090302
  getFFMIComment (fatRate, FFMI, gender) {
    let FFMIBoundary,
        FatRateBoundary;

    if (gender === 0) {
      FFMIBoundary = [18, 21, 28];
      FatRateBoundary = [17, 21, 50];
    } else {
      FFMIBoundary = [15, 18, 25];
      FatRateBoundary = [23, 27, 56];
    }

    if (FFMI < FFMIBoundary[0]) {
      if (fatRate <= FatRateBoundary[0]) {
        return this.translate.instant('other.tooThin');
      } else if (fatRate > FatRateBoundary[0] && fatRate <= FatRateBoundary[1]) {
        return this.translate.instant('other.lackOfTraining');
      } else {
        return this.translate.instant('other.recessiveObesity');
      }

    } else if (FFMI >= FFMIBoundary[0] && FFMI <= FFMIBoundary[1]) {
      if (fatRate <= FatRateBoundary[0]) {
        return this.translate.instant('other.generallyThin');
      } else if (fatRate > FatRateBoundary[0] && fatRate <= FatRateBoundary[1]) {
        return this.translate.instant('other.normalPosture');
      } else {
        return this.translate.instant('other.generallyFat');
      }

    } else if (FFMI > FFMIBoundary[1]) {
      if (fatRate <= FatRateBoundary[0]) {
        return this.translate.instant('other.bodybuilding');
      } else if (fatRate > FatRateBoundary[0] && fatRate <= FatRateBoundary[1]) {
        return this.translate.instant('other.athletic');
      } else {
        return this.translate.instant('other.fatBody');
      }

    }
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

  // 將秒數轉換成其他時間格式-kidin-1090217
  formatTime (second) {
    if (second) {
      const totalSec = Math.round(second),
          hr = Math.floor(totalSec / 3600),
          min = Math.round((totalSec - hr * 3600) / 60);

      // 剛好59分30秒～59分59秒四捨五入後進位的情況-kidin-1090217
      if (min === 60) {
        return `${hr + 1}:00`;
      } else if (hr === 0 && min === 0) {
        return `-:--`;
      } else {
        const timeTotalMin = ('0' + min).slice(-2);
        return `${hr}:${timeTotalMin}`;
      }
    } else {
      return `-:--`;
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

          if (sortCategory === 'avgSleep' && sortResult[j][sortCategory] !== '-:--') {
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

          if (sortCategory === 'avgSleep' && sortResult[j][sortCategory] !== '-:--') {
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
}
