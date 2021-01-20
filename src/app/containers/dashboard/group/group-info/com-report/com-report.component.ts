import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import SimpleLinearRegression from 'ml-regression-simple-linear';
import moment from 'moment';
import * as _Highcharts from 'highcharts';
import * as lodash from 'lodash';
import { first } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { UtilsService } from '@shared/services/utils.service';
import { HashIdService } from '@shared/services/hash-id.service';
import { ReportService } from '../../../../../shared/services/report.service';
import { GroupService } from '../../../services/group.service';

const Highcharts: any = _Highcharts; // 不檢查highchart型態

@Component({
  selector: 'app-com-report',
  templateUrl: './com-report.component.html',
  styleUrls: ['./com-report.component.scss']
})
export class ComReportComponent implements OnInit, OnDestroy {

  @ViewChild('groupSortTable', {static: false})
  groupSortTable: MatSort;
  @ViewChild('personSortTable', {static: false})
  personSortTable: MatSort;

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
  sortStatus = {
    group: false,
    person: false
  };
  showAll = {
    group: false,
    person: false
  };

  mouseEnter = {
    menu: false,
    table: false
  };

  groupMenu = {
    show: false,
    focusGid: '',
    x: null,
    y: null
  };

  personalMenu = {
    show: false,
    focusId: null,
    x: null,
    y: null
  };

  checkClickEvent = false;

  showTableMenu = {
    group: false,
    person: false
  };

  hadGroupMemberList = false;

  sortCategory = {
    group: '',
    person: ''
  };

  groupHeaderRowDef = [
    'name',
    'memberNum',
    'avgActivityNum',
    'weekFrequency',
    'avgTime',
    'avgFitTime',
    'avgPai',
    'avgCalories',
    'HRZone'
  ];

  personHeaderRowDef = [
    'name',
    'totalActivityNum',
    'weekFrequency',
    'totalTime',
    'fitTime',
    'pai',
    'totalCalories',
    'likeType',
    'HRZone'
  ];

  groupTableTypeList = {
    filter: [
      {
        id: 0,
        i18n: '',
        checked: false,
        level: 30
      },
      {
        id: 1,
        i18n: '',
        checked: false,
        level: 40
      },
      {
        id: 2,
        i18n: '',
        checked: false,
        level: 50
      }
    ],
    column: [  // name為必須欄位，故不開放設定
      {
        id: 0,
        rowType: 'memberNum',
        i18n: '',
        checked: false
      },
      {
        id: 1,
        rowType: 'avgActivityNum',
        i18n: '',
        checked: false
      },
      {
        id: 2,
        rowType: 'weekFrequency',
        i18n: '',
        checked: false
      },
      {
        id: 3,
        rowType: 'avgTime',
        i18n: '',
        checked: false
      },
      {
        id: 4,
        rowType: 'avgFitTime',
        i18n: '',
        checked: false
      },
      {
        id: 5,
        rowType: 'avgPai',
        i18n: '',
        checked: false
      },
      {
        id: 6,
        rowType: 'avgCalories',
        i18n: '',
        checked: false
      },
      {
        id: 7,
        rowType: 'HRZone',
        i18n: '',
        checked: false
      }
    ]
  };

  personTableTypeList = {
    filter: [
      {
        id: 0,
        i18n: '',
        checked: false,
        level: 30
      },
      {
        id: 1,
        i18n: '',
        checked: false,
        level: 40
      },
      {
        id: 2,
        i18n: '',
        checked: false,
        level: 50
      }
    ],
    column: [  // name為必須欄位，故不開放設定
      {
        id: 0,
        rowType: 'totalActivityNum',
        i18n: '',
        checked: false
      },
      {
        id: 1,
        rowType: 'weekFrequency',
        i18n: '',
        checked: false
      },
      {
        id: 2,
        rowType: 'totalTime',
        i18n: '',
        checked: false
      },
      {
        id: 3,
        rowType: 'fitTime',
        i18n: '',
        checked: false
      },
      {
        id: 4,
        rowType: 'pai',
        i18n: '',
        checked: false
      },
      {
        id: 5,
        rowType: 'totalCalories',
        i18n: '',
        checked: false
      },
      {
        id: 6,
        rowType: 'likeType',
        i18n: '',
        checked: false
      },
      {
        id: 7,
        rowType: 'HRZone',
        i18n: '',
        checked: false
      }
    ]
  };

  tableTypeListOpt = {
    max: 5,
    min: 2,
    tableCheckedNum: {
      group: {
        filter: 0,
        column: 0
      },
      person: {
        filter: 0,
        column: 0
      }
    },

    set setMax (num: number) {
      this.max = num;
    },

    set setMin (num: number) {
      this.min = num;
    },

    get getMax () {
      return this.max;
    },

    get getMin () {
      return this.min;
    }

  };

  // 資料儲存用變數-kidin-1090115
  token: string;
  groupLevel: number;
  groupId: string;
  groupData: any;
  allLevelGroupData: any;  // 群組本身資料
  initGroupList = {  // 將建好的資料模板儲存方便初始化
    super: [],
    high: [],
    middle: [],

    set setSuperModel(model) {
      this.super = model;
    },

    set setHighModel(model) {
      this.high = model;
    },

    set setMiddleModel(model) {
      this.middle = model;
    },

    get getSuperModel() {
      return this.super;
    },

    get getHighModel() {
      return this.high;
    },

    get getMiddleModel() {
      return this.middle;
    }

  };
  superGroupList = [];  // 處理企業團體分析及在個人分析顯示所屬品牌（未開放）/企業。
  highGroupList = [];  // 處理分店（未開放）/分公司團體分析
  middleGroupList = [];  // 處理健身房（未開放）/部門團體分析
  lowGroupList = [];  // 處理個人分析
  allGroupList: Array<any>;  // 群組所有成員列表
  superCountModel = {};
  highCountModel = {};
  middleCountModel = {};
  dateModel: any;
  groupImg: string;
  brandImg: string;
  brandName = '';
  branchName = '';
  defaultDate = 'last7Days';
  selectDate = {
    startDate: moment().subtract(6, 'days').format('YYYY-MM-DDT00:00:00.000Z'),
    endDate: moment().format('YYYY-MM-DDT23:59:59.999Z')
  };
  diffDay: number;
  reportCategory = 99;
  reportEndDate = '';
  period = '';
  reportRangeType = 1;
  reportCreatedTime = moment().format('YYYY-MM-DD HH:mm');
  hasDataNumber = 0;
  passPrivacyNum = 0;
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

  tableData = {
    display: {  // matTable用資料
      group: new MatTableDataSource<any>(),
      person: new MatTableDataSource<any>()
    },
    relay: { // 已處理過Array長度完整的資料
      group: [],
      person: []
    },
    backUp: {  // 備份完整資料供matTable排序或全顯示時使用
      group: [],
      person: []
    }
  };

  groupPage = {
    memberList: [],
    info: '',
    report: ''
  };
  personalPage = {
    belongGroup: [],
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
  ) {}

  ngOnInit() {
    this.token = this.utilsService.getToken() || '';
    this.loadTableTypeList();
    this.getCurrentGroupId();
    this.getAllLevelGroupInfo();

    // 使用rxjs訂閱運動類別使運動類別更改時可以即時切換-kidin-1090121
    this.groupService.getreportCategory().pipe(first()).subscribe(res => {
      this.reportCategory = res;
      this.loadCategoryData(res);
    });

    // 確認是否為預覽列印頁面-kidin-1090205
    if (location.search.indexOf('ipm=s') > -1) {
      this.isPreviewMode = true;
    }

    this.createSortTable();
  }

  // 確認ngx translate套件已經載入再產生翻譯-kidin-1090415
  loadTableTypeList () {
    this.translate.get('hello.world').subscribe(() => {
      this.groupTableTypeList.filter[0].i18n = this.translate.instant('universal_group_enterprise');
      this.groupTableTypeList.filter[1].i18n = this.translate.instant('universal_group_companyBranch');
      this.groupTableTypeList.filter[2].i18n = this.translate.instant('universal_group_department');

      this.groupTableTypeList.column[0].i18n = this.translate.instant('universal_activityData_people');
      this.groupTableTypeList.column[1].i18n =
      `${this.translate.instant('universal_activityData_perCapita')} ${this.translate.instant('universal_activityData_numberOf')}`;
      this.groupTableTypeList.column[2].i18n = this.translate.instant('universal_activityData_weeklyActivityFrequency');
      this.groupTableTypeList.column[3].i18n =
        `${this.translate.instant('universal_activityData_perCapita')} ${this.translate.instant('universal_activityData_timing')}`;
      this.groupTableTypeList.column[4].i18n =
        `${this.translate.instant('universal_activityData_perCapita')} ${this.translate.instant('universal_activityData_benefitime')}`;
      this.groupTableTypeList.column[5].i18n =
        `${this.translate.instant('universal_activityData_perCapita')} ${this.translate.instant('universal_activityData_pai')}`;
      this.groupTableTypeList.column[6].i18n =
        `${this.translate.instant('universal_activityData_perCapita')} ${this.translate.instant('universal_userProfile_calories')}`;
      this.groupTableTypeList.column[7].i18n = this.translate.instant('universal_activityData_hrZone');

      this.personTableTypeList.filter[0].i18n = this.translate.instant('universal_group_enterprise');
      this.personTableTypeList.filter[1].i18n = this.translate.instant('universal_group_companyBranch');
      this.personTableTypeList.filter[2].i18n = this.translate.instant('universal_group_department');

      this.personTableTypeList.column[0].i18n = this.translate.instant('universal_activityData_totalActivity');
      this.personTableTypeList.column[1].i18n = this.translate.instant('universal_activityData_weeklyActivityFrequency');
      this.personTableTypeList.column[2].i18n = this.translate.instant('universal_activityData_limit_totalTime');
      this.personTableTypeList.column[3].i18n = this.translate.instant('universal_activityData_benefitime');
      this.personTableTypeList.column[4].i18n = this.translate.instant('universal_activityData_pai');
      this.personTableTypeList.column[5].i18n = this.translate.instant('universal_activityData_totalCalories');
      this.personTableTypeList.column[6].i18n = this.translate.instant('universal_activityData_activityPreferences');
      this.personTableTypeList.column[7].i18n = this.translate.instant('universal_activityData_hrZone');
    });

  }

  // 從url取得現在所在群組id-kidin-1090604
  getCurrentGroupId () {
    const hashGroupId = this.route.snapshot.paramMap.get('groupId');
    this.groupId = this.hashIdService.handleGroupIdDecode(hashGroupId);
  }

  // 先從rxjs取得同"品牌/企業"清單，若不同群組再call api-kidin-1090604
  getAllLevelGroupInfo () {
    this.groupService.getAllLevelGroupInfo().pipe(first()).subscribe(res => {

      if (res.hasOwnProperty('brands')) {

        if (
          res.hasOwnProperty('brands')
          && this.getPartGroupId(res.brands[0].groupId, 3) === this.getPartGroupId(this.groupId, 3)
        ) {
          this.allLevelGroupData = res;
          this.getIdListStart();
        } else {
          const groupBody = {
            token: this.token,
            groupId: this.groupId,
            groupLevel: '30',
            infoType: 1,
            avatarType: 3
          };

          this.groupService.fetchGroupMemberList(groupBody).subscribe(resp => {
            if (resp.resultCode === 200) {
              this.allLevelGroupData = resp.info.subGroupInfo;
              this.groupService.saveAllLevelGroupInfo(this.allLevelGroupData);
              this.getIdListStart();
            } else {
              console.log('Error');
            }

          });

        }

      } else {
        setTimeout(() => {
          this.getAllLevelGroupInfo();
        }, 100);

      }

    });

  }

  // 先從rxjs取得成員ID清單，若取不到或不同群組再call api-kidin-1090211
  getIdListStart () {
    this.groupLevel = this.utilsService.displayGroupLevel(this.groupId);

    this.groupService.getMemberList().pipe(first()).subscribe(res => {
      if (res.groupId === '' || res.groupId !== this.groupId || true) { // 待生活追蹤新增團體分析再將判斷改回-kidin-1090616
        // 先從service取得群組資訊，若取不到再call api-kidin-1081210
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
        this.allGroupList = res.groupList;
        this.sortMember(+this.groupLevel, this.allGroupList);

        this.groupService.getGroupInfo().subscribe(result => {
          this.groupData = result;
          this.showGroupInfo();
        });

      }

    });

    this.hadGroupMemberList = true;
  }

  // 取得所有成員id list並使用rxjs儲存至service-kidin-10900310
  getGroupMemberIdList () {
    const body = {
      token: this.token,
      groupId: this.groupId,
      groupLevel: this.groupLevel,
      infoType: 5,
      avatarType: 3
    };

    this.groupService.fetchGroupMemberList(body).subscribe(res => {

      const memlist = [],
            memberList = res.info.groupMemberInfo;
      for (let i = 0; i < memberList.length; i++) {
        const memberGroupIdArr = memberList[i].groupId.split('-'),
              groupIdArr = this.groupId.split('-');

        switch (this.groupLevel) {
          case 30:
            memberGroupIdArr.length = 3;
            groupIdArr.length = 3;
            if (memberList[i].accessRight >= 30 && JSON.stringify(memberGroupIdArr) === JSON.stringify(groupIdArr)) {
              memlist.push({
                id: memberList[i].memberId,
                name: memberList[i].memberName,
                groupId: memberList[i].groupId
              });
            }
            break;
          case 40:
            memberGroupIdArr.length = 4;
            groupIdArr.length = 4;
            if (memberList[i].accessRight >= 40 && JSON.stringify(memberGroupIdArr) === JSON.stringify(groupIdArr)) {
              memlist.push({
                id: memberList[i].memberId,
                name: memberList[i].memberName,
                groupId: memberList[i].groupId
              });
            }
            break;
          case 60:
            if (memberList[i].accessRight >= 50 && memberList[i].groupId === this.groupId) {
              memlist.push({
                id: memberList[i].memberId,
                name: memberList[i].memberName,
                groupId: memberList[i].groupId
              });
            }
            break;
        }
      }

      this.allGroupList = memlist;
      this.sortMember(+this.groupLevel, this.allGroupList);

      const groupListInfo = {
        groupId: this.groupId,
        groupList: this.allGroupList
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

    this.defaultDate = `${this.selectDate.startDate}_${this.selectDate.endDate}`;

    if (this.isPreviewMode) {
      this.handleSubmitSearch('url');
    }

  }

  // 依群組階層將成員分類，並過濾已解散群組和使用set過濾重複階層的成員-kidin-1090602
  sortMember (level, list) {

      const lowObj = {},
            middleObj = {},
            highObj = {},
            superObj = {};
      for (let i = 0; i < list.length; i++) {

        if (lowObj[list[i].id]) {

          const groupName = this.getGroupName(list[i].groupId, false);
          if (groupName !== 'groupDisband') {
            lowObj[list[i].id].belongGroup.push({
              gid: list[i].groupId,
              gName: {
                groupName: groupName,
                upLevelName: this.getGroupName(list[i].groupId, true)
              }
            });

          }

        } else {

          const groupName = this.getGroupName(list[i].groupId, false);
          if (groupName !== 'groupDisband') {
            lowObj[list[i].id] = {
              name: list[i].name,
              belongGroup: [{
                gid: list[i].groupId,
                gName: {
                  groupName: groupName,
                  upLevelName: this.getGroupName(list[i].groupId, true)
                }

              }]

            };

          }

        }

        const superGroupId = this.getPartGroupId(list[i].groupId, 3),
              highGroupId = this.getPartGroupId(list[i].groupId, 4),
              middleGroupId = this.getPartGroupId(list[i].groupId, 5);

        if (middleObj[middleGroupId] && this.getGroupName(list[i].groupId, false) !== 'groupDisband') {
          middleObj[middleGroupId].add(JSON.stringify({
              id: list[i].id,
              name: list[i].name,
              passPrivacy: true
          }));
        } else if (middleGroupId !== `${highGroupId}-0` && this.getGroupName(list[i].groupId, false) !== 'groupDisband') {
          middleObj[middleGroupId] = new Set();
          middleObj[middleGroupId].add(JSON.stringify({
            id: list[i].id,
            name: list[i].name,
            passPrivacy: true
          }));

        }

        if (level <= 40) {

          if (highObj[highGroupId] && this.getGroupName(list[i].groupId, false) !== 'groupDisband') {
            highObj[highGroupId].add(JSON.stringify({
                id: list[i].id,
                name: list[i].name,
                passPrivacy: true
            }));
          } else if (highGroupId !== `${superGroupId}-0` && this.getGroupName(list[i].groupId, false) !== 'groupDisband') {
            highObj[highGroupId] = new Set();
            highObj[highGroupId].add(JSON.stringify({
              id: list[i].id,
              name: list[i].name,
              passPrivacy: true
            }));

          }

          if (level <= 30) {

            if (superObj[superGroupId] && this.getGroupName(list[i].groupId, false) !== 'groupDisband') {
              superObj[superGroupId].add(JSON.stringify({
                  id: list[i].id,
                  name: list[i].name,
                  passPrivacy: true
              }));
            } else if (this.getGroupName(list[i].groupId, false) !== 'groupDisband') {
              superObj[superGroupId] = new Set();
              superObj[superGroupId].add(JSON.stringify({
                id: list[i].id,
                name: list[i].name,
                passPrivacy: true
              }));

            }

          }

      }

    }

    for (const uid in lowObj) {

      if (lowObj.hasOwnProperty(uid)) {
        this.lowGroupList.push({
          id: uid,
          name: lowObj[uid].name,
          belongGroup: lowObj[uid].belongGroup,
        });

      }

    }

    this.initGroupList.setMiddleModel = this.convertGroupList(middleObj, 5);

    if (level <= 40) {
      this.initGroupList.setHighModel = this.convertGroupList(highObj, 4);

      if (level <= 30) {
        this.initGroupList.setSuperModel = this.convertGroupList(superObj, 3);
      }

    }

  }

  // 取得群組名稱或群組解散狀態-kidin-1090604
  getGroupName (gid: string, upLevel: boolean) {
    if (upLevel) {

      if (gid === `${this.getPartGroupId(gid, 3)}-0-0-0`) {
        return '';
      } else if (gid === `${this.getPartGroupId(gid, 4)}-0-0`) {
        return this.allLevelGroupData.brands[0].groupName;
      } else {
        return this.getGroupName(`${this.getPartGroupId(gid, 4)}-0-0`, false);
      }

    } else {

      if (gid === `${this.getPartGroupId(gid, 3)}-0-0-0`) {
        return this.allLevelGroupData.brands[0].groupName;
      } else if (gid === `${this.getPartGroupId(gid, 4)}-0-0`) {

        const branches = this.allLevelGroupData.branches;
        for (let i = 0; i < branches.length; i++) {

          if (branches[i].groupId === gid && branches[i].groupStatus <= 2) {
            return this.allLevelGroupData.branches[i].groupName;
          } else if (branches[i].groupId === gid && branches[i].groupStatus > 2) {
            return 'groupDisband';
          }

        }

      } else {

        const coaches = this.allLevelGroupData.coaches;
        for (let i = 0; i < coaches.length; i++) {

          if (coaches[i].groupId === gid && coaches[i].groupStatus <= 2) {
            return this.allLevelGroupData.coaches[i].groupName;
          } else if (coaches[i].groupId === gid && coaches[i].groupStatus > 2) {
            return 'groupDisband';
          }

        }

      }

    }

  }

  // 取得所需的群組id片段-kidin-1090603
  getPartGroupId (id: string, leng: number) {
    const arr = id.split('-');
    arr.length = leng;
    return arr.join('-');
  }

  // 取得所選日期-kidin-1090331
  getSelectDate (date) {
    this.selectDate = date;
    this.handleSubmitSearch('click');
  }

  // 預先建立分析table-kidin-1090602
  createSortTable () {
    this.tableData.display.person.sort = this.personSortTable;
    this.tableData.display.group.sort = this.groupSortTable;
  }

  // 將群組列表由set轉為array格式-kidin-1090604
  convertGroupList (obj, gidLength) {
    const finalArr = [];
    for (const gid in obj) {

      if (obj.hasOwnProperty(gid)) {

        const arr = Array.from(obj[gid]),
              memArr = [];
        for (let i = 0; i < arr.length; i++) {
          memArr.push(JSON.parse(arr[i] as string));
        }

        let revertGid: string;
        if (gidLength === 5) {
          revertGid = `${gid}-0`;
        } else if (gidLength === 4) {
          revertGid = `${gid}-0-0`;
        } else {
          revertGid = `${gid}-0-0-0`;
        }

        const groupName = this.getGroupName(revertGid, false);
        if (groupName !== 'groupDisband') {
          finalArr.push({
            gid: gid,
            member: memArr,
            data: {
              gName: {
                groupName: this.getGroupName(revertGid, false),
                upLevelName: this.getGroupName(revertGid, true)
              },
              memberNum: memArr.length,
              notPassPrivacyNum: 0,
              totalActivityNum: 0,
              avgActivityNum: 0,
              weekFrequency: 0,
              totalSecond: 0,
              avgTime: '',
              timeRegression: 0,
              fitSecond: 0,
              avgFitTime: '',
              fitTimeRegression: 0,
              pai: 0,
              avgPai: 0,
              paiRegression: 0,
              totalCalories: 0,
              avgCalories: 0,
              caloriesRegression: 0,
              HRZone: [0, 0, 0, 0, 0, 0],
              ratio: '0px'
            },

            get getData() {
              return this.data;
            }

          });

        }

      }

    }

    return finalArr;
  }

  // 使用者送出表單後顯示相關資料-kidin-1081209
  handleSubmitSearch (act: string) {

    if (!this.isLoading) { // 避免重複call運動報告

      if (act === 'click') {
        this.updateUrl('false');
      }
      this.reportCompleted = false;
      this.createReport();
    }

  }

  // 建立運動報告-kidin-1090117
  createReport () {
    this.isLoading = true;
    this.diffDay = moment(this.selectDate.endDate).diff(moment(this.selectDate.startDate), 'days') + 1;
    this.period = `${this.diffDay} ${this.translate.instant(
      'universal_time_day'
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

    this.createTimeStampArr(this.diffDay);

    const groupIdList = [];
    for (let i = 0; i < this.lowGroupList.length; i++) {
      groupIdList.push(this.lowGroupList[i].id);
    }

    const body = {
      token: this.token || '',
      type: this.reportRangeType,
      targetUserId: groupIdList,
      filterStartTime: this.selectDate.startDate,
      filterEndTime: this.selectDate.endDate
    };

    const summaryData = [];
    if (groupIdList.length !== 0) {
      this.reportService.fetchSportSummaryArray(body).subscribe(res => {
        if (Array.isArray(res)) {

          let groupReportData = [];
          for (let j = 0; j < res.length; j++) {

            if (res[j].resultCode !== 403) {
              this.passPrivacyNum++;
            }

            const userIndex = this.getIndex(res[j].userId);
            // 計算有資料的人數，並將資料合併，及計算群組和個人分析資料-kidin-1090212
            if (this.reportRangeType === 1) {
              this.tableData.backUp.person.push(this.getPersonalStatistics(
                res[j].reportActivityDays,
                res[j].resultCode,
                userIndex
              ));

              if (res[j].reportActivityDays && res[j].reportActivityDays.length > 0) {
                this.hasDataNumber++;
                groupReportData = groupReportData.concat(res[j].reportActivityDays);
                summaryData.push(res[j].reportActivityDays);
              }
            } else {
              this.tableData.backUp.person.push(this.getPersonalStatistics(
                res[j].reportActivityWeeks,
                res[j].resultCode,
                userIndex
              ));

              if (res[j].reportActivityWeeks && res[j].reportActivityWeeks.length > 0) {
                this.hasDataNumber++;
                groupReportData = groupReportData.concat(res[j].reportActivityWeeks);
                summaryData.push(res[j].reportActivityWeeks);
              }
            }
          }

          this.finishGroupData();

          // 若沒有任何運動數據則顯示無資料-kidin-1090212
          if (this.hasDataNumber === 0) {
            this.nodata = true;
            this.isLoading = false;
            this.updateUrl('false');
          } else {
            this.nodata = false;
            this.reportEndDate = moment(this.selectDate.endDate.split('T')[0]).format('YYYY-MM-DD');
            this.showReport = true;
            this.updateUrl('true');
            this.sortData(groupReportData);
            this.calPerCategoryData();
            this.getTableOpt();
          }
        } else {
          this.nodata = true;
          this.isLoading = false;
          this.updateUrl('false');
        }

      });

    } else {
      this.isLoading = false;
    }

  }

  // 初始化變數
  initVariable () {
    this.nodata = false;
    this.sortStatus = {
      group: false,
      person: false
    };
    this.showAll = {
      group: false,
      person: false
    };
    this.hasDataNumber = 0;
    this.passPrivacyNum = 0;
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
    this.tableData.display.group.data.length = 0;
    this.tableData.display.person.data.length = 0;
    this.tableData.relay.group = [];
    this.tableData.relay.person = [];
    this.tableData.backUp.group = [];
    this.tableData.backUp.person = [];
    this.chartTimeStamp = [];
    this.searchDate = [];
    this.superCountModel = {};
    this.highCountModel = {};
    this.middleCountModel = {};

    // 藉由深拷貝進行初始化-kidin-1090618
    this.middleGroupList = lodash.cloneDeep(this.initGroupList.getMiddleModel);
    if (+this.groupLevel <= 40) {
      this.highGroupList = lodash.cloneDeep(this.initGroupList.getHighModel);

      if (+this.groupLevel <= 40) {
        this.superGroupList = lodash.cloneDeep(this.initGroupList.getSuperModel);
      }

    }

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
      week.startDate = this.searchDate[0] - 86400 * 1000 * moment(this.searchDate[0]).isoWeekday();
    } else {
      week.startDate = this.searchDate[0];
    }

    if (moment(this.searchDate[1]).isoWeekday() !== 7) {
      weekEndDate = this.searchDate[1] - 86400 * 1000 * moment(this.searchDate[1]).isoWeekday();
    } else {
      weekEndDate = this.searchDate[1];
    }

    week.weekNum = ((weekEndDate - week.startDate) / (86400 * 1000 * 7)) + 1;

    return week;
  }

  // 取得目標資料在群組清單的index-kidin-1090604
  getIndex (uid: string) {
    for (let i = 0; i < this.lowGroupList.length; i++) {

      if (this.lowGroupList[i].id === uid) {
        return i;
      }

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
          typeRowMaxPower = [],
          typeBallHrZoneData = [],
          typeBallCalories = [],
          typeBallDataDate = [],
          typeBallSpeed = [],
          typeBallMaxSpeed = [],
          typeBallHR = [],
          typeBallMaxHR = [];

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
        typeRowHrZoneFive = 0,
        typeBallLength = 0,
        typeBallTotalTrainTime = 0,
        typeBallTotalDistance = 0,
        typeBallHrZoneZero = 0,
        typeBallHrZoneOne = 0,
        typeBallHrZoneTwo = 0,
        typeBallHrZoneThree = 0,
        typeBallHrZoneFour = 0,
        typeBallHrZoneFive = 0;

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
          case '7':
            typeBallLength += +perData['totalActivities'];
            typeBallTotalTrainTime += +perData['totalSecond'];
            typeBallCalories.push(perData['calories']);
            typeBallTotalDistance += perData['totalDistanceMeters'];
            typeBallDataDate.push(this.activitiesList[i].startTime.split('T')[0]);
            typeBallSpeed.push(perData['avgSpeed']);
            typeBallMaxSpeed.push(perData['avgMaxSpeed']);
            typeBallHR.push(perData['avgHeartRateBpm']);
            typeBallMaxHR.push(perData['avgMaxHeartRateBpm']);

            if (perData['totalHrZone0Second'] !== null) {
              typeBallHrZoneZero += perData['totalHrZone0Second'];
              typeBallHrZoneOne += perData['totalHrZone1Second'];
              typeBallHrZoneTwo += perData['totalHrZone2Second'];
              typeBallHrZoneThree += perData['totalHrZone3Second'];
              typeBallHrZoneFour += perData['totalHrZone4Second'];
              typeBallHrZoneFive += perData['totalHrZone5Second'];
              if (
                perData['totalHrZone0Second'] +
                perData['totalHrZone1Second'] +
                perData['totalHrZone2Second'] +
                perData['totalHrZone3Second'] +
                perData['totalHrZone4Second'] +
                perData['totalHrZone5Second'] !== 0
              ) {
                typeBallHrZoneData.push([
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
          default:
            console.log('Not support this sports type.');
            break;
        }
      }
    }

    const typeAllAvgTrainTime = (typeAllTotalTrainTime / this.passPrivacyNum) || 0,
          typeRunAvgTrainTime = (typeRunTotalTrainTime) || 0,
          typeCycleAvgTrainTime = (typeCycleTotalTrainTime) || 0,
          typeWeightTrainAvgTrainTime = (typeWeightTrainTotalTrainTime) || 0,
          typeSwimAvgTrainTime = (typeSwimTotalTrainTime) || 0,
          typeAerobicAvgTrainTime = (typeAerobicTotalTrainTime) || 0,
          typeRowAvgTrainTime = (typeRowTotalTrainTime) || 0,
          typeBallAvgTrainTime = (typeBallTotalTrainTime) || 0;

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
      perTypeLength: [typeRunLength, typeCycleLength, typeWeightTrainLength, typeSwimLength, typeAerobicLength, typeRowLength, typeBallLength],
      perTypeTime: [
        typeRunAvgTrainTime,
        typeCycleAvgTrainTime,
        typeWeightTrainAvgTrainTime,
        typeSwimAvgTrainTime,
        typeAerobicAvgTrainTime,
        typeRowAvgTrainTime,
        typeBallAvgTrainTime
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
  loadCategoryData (type: number) {
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
            avgPersonCalories: total / this.passPrivacyNum,
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
            avgPersonCalories: total / this.passPrivacyNum,
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
  getPersonalStatistics (data: Array<any>, resultCode: number, index: number) {

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
              {type: 'row', count: 0},
              {type: 'ball', count: 0}
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
            fitTimeArr = [],
            calories = [],
            paiWeightingFactor = {  // PAI加權係數
              z0: 0,
              z1: 0.5,
              z2: 1,
              z3: 1.5,
              z4: 2,
              z5: 2.5
            },
            paiArr = [];

      for (let i = 0; i < data.length; i++) {
        idx++;

        if (i === data.length - 1) {
          recordStartTime = moment(data[i].startTime.split('T')[0]);
        }

        let oneDayActivityTime = 0,
            oneDayCalories = 0,
            oneDayFitTime = 0,
            oneDayPAI = 0;
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
          oneDayFitTime += (
            perData.totalHrZone2Second
            + perData.totalHrZone3Second
            + perData.totalHrZone4Second
            + perData.totalHrZone5Second
          );

          oneDayPAI += (
            perData.totalHrZone0Second * paiWeightingFactor.z0
            + perData.totalHrZone1Second * paiWeightingFactor.z1
            + perData.totalHrZone2Second * paiWeightingFactor.z2
            + perData.totalHrZone3Second * paiWeightingFactor.z3
            + perData.totalHrZone4Second * paiWeightingFactor.z4
            + perData.totalHrZone5Second * paiWeightingFactor.z5
          );

          typeCount[+perData.type - 1].count += perData.totalActivities;
        }

        activityTime.unshift(oneDayActivityTime);
        fitTimeArr.unshift(oneDayFitTime);
        calories.unshift(oneDayCalories);
        paiArr.unshift(oneDayPAI / (1285 * 7));
        xPoint.push(idx);

        this.pushAssignGroupData(
          oneDayActivityTime,
          oneDayFitTime,
          oneDayCalories,
          oneDayPAI / (1285 * 7),
          data[i].startTime.split('T')[0],
          index
        );

      }

      const recordEndTime = moment(this.selectDate.endDate.split('T')[0]),
            timeRegression = new SimpleLinearRegression(xPoint, activityTime),
            fitTimeRegression = new SimpleLinearRegression(xPoint, fitTimeArr),
            caloriesRegression = new SimpleLinearRegression(xPoint, calories),
            paiRegression = new SimpleLinearRegression(xPoint, paiArr),
            fitTime = perHRZone.z2 + perHRZone.z3 + perHRZone.z4 + perHRZone.z5;

      let pai: number;
      pai = (((  // PAI公式=((加權後運動秒數 / 週數) / 週目標時間)*100
        perHRZone.z0 * paiWeightingFactor.z0
        + perHRZone.z1 * paiWeightingFactor.z1
        + perHRZone.z2 * paiWeightingFactor.z2
        + perHRZone.z3 * paiWeightingFactor.z3
        + perHRZone.z4 * paiWeightingFactor.z4
        + perHRZone.z5 * paiWeightingFactor.z5
      ) / (this.diffDay / 7)) / (1285 * 7)) * 100;

      let timePeroid;
      if (this.dataDateRange === 'day') {
        timePeroid = this.diffDay;
      } else {
        timePeroid = recordEndTime.diff(recordStartTime, 'days');
      }

      this.countPerGroupData(
        this.lowGroupList[index],
        totalActivityNum,
        totalActivityTime,
        fitTime,
        pai,
        totalCalories,
        perHRZone,
        resultCode
      );

      return {
        id: index,
        name: this.lowGroupList[index].name,
        userId: this.lowGroupList[index].id,
        passPrivacy: true,
        belongGroup: this.lowGroupList[index].belongGroup,
        totalActivityNum: totalActivityNum,
        weekFrequency: (totalActivityNum / timePeroid) * 7,
        totalTime: this.formatHmTime(totalActivityTime),
        timeRegression: timeRegression.slope || 0,
        fitTime: this.formatHmTime(fitTime),
        fitTimeRegression: fitTimeRegression.slope || 0,
        pai: +pai.toFixed(0),
        paiRegression: paiRegression.slope || 0,
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
        ],
        ratio: '0px'
      };

    } else {
      const memInfo = {
        id: index,
        name: this.lowGroupList[index].name,
        userId: this.lowGroupList[index].id,
        passPrivacy: true,
        belongGroup: this.lowGroupList[index].belongGroup,
        totalActivityNum: '--',
        weekFrequency: '--',
        totalTime: '-:--',
        timeRegression: 0,
        fitTime: '-:--',
        fitTimeRegression: 0,
        pai: '--',
        paiRegression: 0,
        totalCalories: '--',
        caloriesRegression: 0,
        likeType: [],
        HRZone: '--',
        ratio: '0px'
      };

      if (resultCode === 403) {
        memInfo.passPrivacy = false;

        this.countPerGroupData(
          this.lowGroupList[index],
          0,
          0,
          0,
          0,
          0,
          {
            z0: 0,
            z1: 0,
            z2: 0,
            z3: 0,
            z4: 0,
            z5: 0
          },
          resultCode
        );

      }

      return memInfo;
    }

  }

  // 團體分析線性回歸用數據-kidin-1090605
  pushAssignGroupData (activityTime, fitTime, calories, pai, startTime, idx) {
    if (+this.groupLevel <= 40) {

      const belongGroup = this.lowGroupList[idx].belongGroup;
      for (let i = 0; i < belongGroup.length; i++) {

        // 部門回歸分析
        if (this.middleCountModel.hasOwnProperty(belongGroup[i].gid)) {
          this.middleCountModel[belongGroup[i].gid][startTime].sumActivityTime = activityTime;
          this.middleCountModel[belongGroup[i].gid][startTime].sumFitTime = fitTime;
          this.middleCountModel[belongGroup[i].gid][startTime].sumCalories = calories;
          this.middleCountModel[belongGroup[i].gid][startTime].sumPai = pai;
        } else if (
          belongGroup[i].gid !== `${this.getPartGroupId(belongGroup[i].gid, 4)}-0-0`
          && belongGroup[i].gid !== `${this.getPartGroupId(belongGroup[i].gid, 3)}-0-0-0`
        ) {
          this.middleCountModel[belongGroup[i].gid] = this.createDateModel();
          this.middleCountModel[belongGroup[i].gid][startTime].sumActivityTime = activityTime;
          this.middleCountModel[belongGroup[i].gid][startTime].sumFitTime = fitTime;
          this.middleCountModel[belongGroup[i].gid][startTime].sumCalories = calories;
          this.middleCountModel[belongGroup[i].gid][startTime].sumPai = pai;
        }

      }

      for (let i = 0; i < belongGroup.length; i++) {

        // 分公司回歸分析（數據含全部門）
        const hGid = `${this.getPartGroupId(belongGroup[i].gid, 4)}-0-0`;
        if (this.highCountModel.hasOwnProperty(hGid)) {
          this.highCountModel[hGid][startTime].sumActivityTime = activityTime;
          this.highCountModel[hGid][startTime].sumFitTime = fitTime;
          this.highCountModel[hGid][startTime].sumCalories = calories;
          this.highCountModel[hGid][startTime].sumPai = pai;
        } else if (hGid !== `${this.getPartGroupId(hGid, 3)}-0-0-0`) {
          this.highCountModel[hGid] = this.createDateModel();
          this.highCountModel[hGid][startTime].sumActivityTime = activityTime;
          this.highCountModel[hGid][startTime].sumFitTime = fitTime;
          this.highCountModel[hGid][startTime].sumCalories = calories;
          this.highCountModel[hGid][startTime].sumPai = pai;
        }

      }

      if (+this.groupLevel <= 30) {

        for (let i = 0; i < belongGroup.length; i++) {

          // 企業回歸分析（數據含全分公司和部門）
          const sGid = `${this.getPartGroupId(belongGroup[i].gid, 3)}-0-0-0`;
          if (this.superCountModel.hasOwnProperty(sGid)) {
            this.superCountModel[sGid][startTime].sumActivityTime = activityTime;
            this.superCountModel[sGid][startTime].sumFitTime = fitTime;
            this.superCountModel[sGid][startTime].sumCalories = calories;
            this.superCountModel[sGid][startTime].sumPai = pai;
          } else {
            this.superCountModel[sGid] = this.createDateModel();
            this.superCountModel[sGid][startTime].sumActivityTime = activityTime;
            this.superCountModel[sGid][startTime].sumFitTime = fitTime;
            this.superCountModel[sGid][startTime].sumCalories = calories;
            this.superCountModel[sGid][startTime].sumPai = pai;
          }

        }

      }

    }

  }

  // 計算群組分析的回歸分析斜率-kidin-1090608
  getGroupDataRegression (gid) {
    const xPoint = [],
          activityTime = [],
          fitTimeArr = [],
          calories = [],
          paiArr = [];

    let xIdx = 1;
    switch (gid.split('-').length) {
      case 5:

        const revertMGid = `${gid}-0`;
        for (const date in this.middleCountModel[revertMGid]) {

          if (this.middleCountModel[revertMGid].hasOwnProperty(date)) {
            xPoint.push(xIdx);
            activityTime.push(this.middleCountModel[revertMGid][date].activityTime);
            fitTimeArr.push(this.middleCountModel[revertMGid][date].fitTime);
            calories.push(this.middleCountModel[revertMGid][date].calories);
            paiArr.push(this.middleCountModel[revertMGid][date].pai);
            xIdx++;
          }

        }

        return {
          activityTimeRgs: new SimpleLinearRegression(xPoint, activityTime).slope || 0,
          fitTimeRgs: new SimpleLinearRegression(xPoint, fitTimeArr).slope || 0,
          caloriesRgs: new SimpleLinearRegression(xPoint, calories).slope || 0,
          paiRgs: new SimpleLinearRegression(xPoint, paiArr).slope || 0
        };

      case 4:

        const revertHGid = `${gid}-0-0`;
        for (const date in this.highCountModel[revertHGid]) {

          if (this.highCountModel[revertHGid].hasOwnProperty(date)) {
            xPoint.push(xIdx);
            activityTime.push(this.highCountModel[revertHGid][date].activityTime);
            fitTimeArr.push(this.highCountModel[revertHGid][date].fitTime);
            calories.push(this.highCountModel[revertHGid][date].calories);
            paiArr.push(this.highCountModel[revertHGid][date].pai);
            xIdx++;
          }

        }

        return {
          activityTimeRgs: new SimpleLinearRegression(xPoint, activityTime).slope || 0,
          fitTimeRgs: new SimpleLinearRegression(xPoint, fitTimeArr).slope || 0,
          caloriesRgs: new SimpleLinearRegression(xPoint, calories).slope || 0,
          paiRgs: new SimpleLinearRegression(xPoint, paiArr).slope || 0
        };

      case 3:

        const revertSGid = `${gid}-0-0-0`;
        for (const date in this.superCountModel[revertSGid]) {

          if (this.superCountModel[revertSGid].hasOwnProperty(date)) {
            xPoint.push(xIdx);
            activityTime.push(this.superCountModel[revertSGid][date].activityTime);
            fitTimeArr.push(this.superCountModel[revertSGid][date].fitTime);
            calories.push(this.superCountModel[revertSGid][date].calories);
            paiArr.push(this.superCountModel[revertSGid][date].pai);
            xIdx++;
          }

        }

        return {
          activityTimeRgs: new SimpleLinearRegression(xPoint, activityTime).slope || 0,
          fitTimeRgs: new SimpleLinearRegression(xPoint, fitTimeArr).slope || 0,
          caloriesRgs: new SimpleLinearRegression(xPoint, calories).slope || 0,
          paiRgs: new SimpleLinearRegression(xPoint, paiArr).slope || 0
        };

    }

  }

  // 將個人數據加總至所屬群組，供團體分析用數據-kidin-1090605
  countPerGroupData (
    info,
    totalActivityNum,
    totalActivityTime,
    fitTime,
    pai,
    totalCalories,
    perHRZone,
    resultCode,
  ) {
    const filterSet = new Set();
    for (let i = 0; i < info.belongGroup.length; i++) {

      for (let mIdx = 0; mIdx < this.middleGroupList.length; mIdx++) {

        if (this.getPartGroupId(info.belongGroup[i].gid, 5) === this.middleGroupList[mIdx].gid) {
          this.middleGroupList[mIdx].data.totalActivityNum += totalActivityNum;
          this.middleGroupList[mIdx].data.totalSecond += totalActivityTime;
          this.middleGroupList[mIdx].data.fitSecond += fitTime;
          this.middleGroupList[mIdx].data.pai += pai;
          this.middleGroupList[mIdx].data.totalCalories += totalCalories;
          this.middleGroupList[mIdx].data.HRZone =
            this.middleGroupList[mIdx].data.HRZone.map((hr: number, idx: number) => hr + perHRZone[`z${idx}`]);

          if (resultCode === 403) {
            this.middleGroupList[mIdx].data.notPassPrivacyNum++;

            for (let k = 0; k < this.middleGroupList[mIdx].member.length; k++) {

              if (this.middleGroupList[mIdx].member[k].id === info.id) {
                this.middleGroupList[mIdx].member[k].passPrivacy = false;
              }

            }

          }

        }

      }

      if (+this.groupLevel <= 40) {
        filterSet.add(`${this.getPartGroupId(info.belongGroup[i].gid, 4)}`);
      }

    }

    if (+this.groupLevel <= 40) {
      const filterArr = Array.from(filterSet);
      for (let j = 0; j < filterArr.length; j++) {

        for (let hIdx = 0; hIdx < this.highGroupList.length; hIdx++) {

          if (filterArr[j] === this.highGroupList[hIdx].gid) {
            this.highGroupList[hIdx].data.totalActivityNum += totalActivityNum;
            this.highGroupList[hIdx].data.totalSecond += totalActivityTime;
            this.highGroupList[hIdx].data.fitSecond += fitTime;
            this.highGroupList[hIdx].data.pai += pai;
            this.highGroupList[hIdx].data.totalCalories += totalCalories;
            this.highGroupList[hIdx].data.HRZone =
              this.highGroupList[hIdx].data.HRZone.map((hr: number, idx: number) => hr + perHRZone[`z${idx}`]);

            if (resultCode === 403) {
              this.highGroupList[hIdx].data.notPassPrivacyNum++;

              for (let k = 0; k < this.highGroupList[hIdx].member.length; k++) {

                if (this.highGroupList[hIdx].member[k].id === info.id) {
                  this.highGroupList[hIdx].member[k].passPrivacy = false;
                }

              }

            }

          }

        }

      }

    }

    if (+this.groupLevel <= 30) {
      this.superGroupList[0].data.totalActivityNum += totalActivityNum;
      this.superGroupList[0].data.totalSecond += totalActivityTime;
      this.superGroupList[0].data.fitSecond += fitTime;
      this.superGroupList[0].data.pai += pai;
      this.superGroupList[0].data.totalCalories += totalCalories;
      this.superGroupList[0].data.HRZone =
        this.superGroupList[0].data.HRZone.map((hr: number, idx: number) => hr + perHRZone[`z${idx}`]);

      if (resultCode === 403) {
        this.superGroupList[0].data.notPassPrivacyNum++;

        for (let k = 0; k < this.superGroupList[0].member.length; k++) {

          if (this.superGroupList[0].member[k].id === info.id) {
            this.superGroupList[0].member[k].passPrivacy = false;
          }

        }

      }

    }

  }

  // 將群組資料補全及將部份數據轉成所需格式-kidin-1090608
  finishGroupData () {

    let timePeroid;
    if (this.dataDateRange === 'day') {
      timePeroid = this.diffDay;
    } else {
      timePeroid = this.findDate().weekNum;
    }

    for (let i = 0; i < this.middleGroupList.length; i++) {
      const regression = this.getGroupDataRegression(this.middleGroupList[i].gid),
            mData = this.middleGroupList[i].getData;
      mData.avgActivityNum = mData.totalActivityNum / (mData.memberNum - mData.notPassPrivacyNum) || 0;
      mData.avgTime = this.formatHmTime(mData.totalSecond / (mData.memberNum - mData.notPassPrivacyNum));
      mData.timeRegression = regression.activityTimeRgs;
      mData.weekFrequency = ((mData.totalActivityNum / (mData.memberNum - mData.notPassPrivacyNum)) / timePeroid) * 7 || 0;
      mData.avgFitTime = this.formatHmTime(mData.fitSecond / (mData.memberNum - mData.notPassPrivacyNum));
      mData.fitTimeRegression = regression.fitTimeRgs;
      mData.avgPai = mData.pai / (mData.memberNum - mData.notPassPrivacyNum) || 0;
      mData.paiRegression = regression.paiRgs;
      mData.avgCalories = mData.totalCalories / (mData.memberNum - mData.notPassPrivacyNum) || 0;
      mData.caloriesRegression = regression.caloriesRgs;
    }

    if (+this.groupLevel <= 40) {

      for (let j = 0; j < this.highGroupList.length; j++) {
        const regression = this.getGroupDataRegression(this.highGroupList[j].gid),
              hData = this.highGroupList[j].getData;
        hData.avgActivityNum = hData.totalActivityNum / (hData.memberNum - hData.notPassPrivacyNum) || 0;
        hData.avgTime = this.formatHmTime(hData.totalSecond / (hData.memberNum - hData.notPassPrivacyNum));
        hData.timeRegression = regression.activityTimeRgs;
        hData.weekFrequency = ((hData.totalActivityNum / (hData.memberNum - hData.notPassPrivacyNum)) / timePeroid) * 7 || 0;
        hData.avgFitTime = this.formatHmTime(hData.fitSecond / (hData.memberNum - hData.notPassPrivacyNum));
        hData.fitTimeRegression = regression.fitTimeRgs;
        hData.avgPai = hData.pai / (hData.memberNum - hData.notPassPrivacyNum) || 0;
        hData.paiRegression = regression.paiRgs;
        hData.avgCalories = hData.totalCalories / (hData.memberNum - hData.notPassPrivacyNum) || 0;
        hData.caloriesRegression = regression.caloriesRgs;
      }

      if (+this.groupLevel <= 30) {

        for (let k = 0; k < this.superGroupList.length; k++) {
          const regression = this.getGroupDataRegression(this.superGroupList[k].gid),
                sData = this.superGroupList[k].getData;
          sData.avgActivityNum = sData.totalActivityNum / (sData.memberNum - sData.notPassPrivacyNum) || 0;
          sData.avgTime = this.formatHmTime(sData.totalSecond / (sData.memberNum - sData.notPassPrivacyNum));
          sData.timeRegression = regression.activityTimeRgs;
          sData.weekFrequency = ((sData.totalActivityNum / (sData.memberNum - sData.notPassPrivacyNum)) / timePeroid) * 7 || 0;
          sData.avgFitTime = this.formatHmTime(sData.fitSecond / (sData.memberNum - sData.notPassPrivacyNum));
          sData.fitTimeRegression = regression.fitTimeRgs;
          sData.avgPai = sData.pai / (sData.memberNum - sData.notPassPrivacyNum) || 0;
          sData.paiRegression = regression.paiRgs;
          sData.avgCalories = sData.totalCalories / (sData.memberNum - sData.notPassPrivacyNum) || 0;
          sData.caloriesRegression = regression.caloriesRgs;
        }

      }

    }

  }

  // 確認群組分析和個人分析的資料長度決定是否部份隱藏-kidin-1090610
  checkDataLength (type: string) {

    if (type !== 'all') {
      this.tableData.display[type].data = this.tableData.relay[type].slice();

      if (this.tableData.relay[type].length <= 8 || this.showAll[type] === true) {
        this.showAll[type] = true;
      } else {
        this.tableData.display[type].data.length = 8;
        this.showAll[type] = false;
      }

    } else {
      this.checkDataLength('person');
      this.checkDataLength('group');
    }

  }

  // 根據報告日期建立日期模板以供資料統計使用-kidin-1090603
  createDateModel () {
    const model = new Object(),
          data = {
            activityTime: 0,
            fitTime: 0,
            pai: 0,
            calories: 0,

            set sumActivityTime(num: number) {
              this.activityTime += num;
            },
            set sumFitTime(num: number) {
              this.fitTime += num;
            },
            set sumPai(num: number) {
              this.pai += num;
            },
            set sumCalories(num: number) {
              this.calories += num;
            }

          };
    let startDate: number;
    if (this.dataDateRange === 'day') {
      startDate = moment(this.selectDate.startDate).valueOf();

      for (let i = 0; i < this.diffDay; i++) {
        const nextDate = moment(startDate + 1000 * 60 * 60 * 24 * i).format('YYYY-MM-DD');
        model[nextDate] = Object.create(data);
      }

    } else {

      // 周報告開頭是星期日-kidin-1090312
      if (moment(this.selectDate.startDate).isoWeekday() !== 7) {
        startDate = moment(this.selectDate.startDate).valueOf() - 86400 * 1000 * moment(this.selectDate.startDate).isoWeekday();
      } else {
        startDate = moment(this.selectDate.startDate).valueOf();
      }

      for (let i = 0; i < this.findDate().weekNum; i++) {
        const nextDate = moment(startDate + 1000 * 60 * 60 * 24 * 7 * i).format('YYYY-MM-DD');
        model[nextDate] = Object.create(data);
      }

    }

    return model;
  }

  // 將秒數轉換成個人分析需要的時間格式-kidin-1090217
  formatHmTime (second: number) {
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
        case 'ball':
          return 'icon-svg_web-icon_p3_056-ball';
        default:
          return 'icon-svg_web-icon_p1_083-run';
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
          newUrl = `${preUrl}?${searchString} ${newSufUrl}`;
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

  // 點擊運動項目後該類別相關資料特別顯示-kidin-1090214
  assignCategory (category) {
    if (category === this.selectType) {
      this.selectType = '99';
    } else {
      this.selectType = category;
    }
  }

  // 顯示所有個人分析列表-kidin-1090305
  showAllData (type: string) {
    this.showAll[type] = true;
    this.tableData.display[type].data = this.tableData.relay[type].slice();
  }

  // 依據點選的項目對群組分析進行排序-kidin-1090610
  sortGroupData () {
    this.sortStatus.group = true;
    const sortCategory = this.groupSortTable.active,
          sortDirection = this.groupSortTable.direction;
    this.sortCategory.group = sortCategory;

    let sortResult = this.tableData.backUp.group.slice();
    sortResult = this.getTargetRatio(sortResult, sortCategory, 'group');

    let swapped = true;
    for (let i = 0; i < sortResult.length && swapped; i++) {
      swapped = false;
      for (let j = 0; j < sortResult.length - 1 - i; j++) {

        const currentItem = sortResult[j]['data'],
              nextItem = sortResult[j + 1]['data'];
        if (sortDirection === 'asc') {

          if ((sortCategory === 'avgTime' || sortCategory === 'avgFitTime')) {

            const sortA = this.timeStringSwitchNum(currentItem[sortCategory]),
                  sortB = this.timeStringSwitchNum(nextItem[sortCategory]);

            if (sortA > sortB) {
              swapped = true;
              [sortResult[j], sortResult[j + 1]] = [sortResult[j + 1], sortResult[j]];
            }

          } else {

            if (currentItem[sortCategory] > nextItem[sortCategory] || nextItem[sortCategory] === '--') {
              swapped = true;
              [sortResult[j], sortResult[j + 1]] = [sortResult[j + 1], sortResult[j]];
            }

          }

        } else {

          if ((sortCategory === 'avgTime' || sortCategory === 'avgFitTime')) {
            const sortA = this.timeStringSwitchNum(currentItem[sortCategory]),
                  sortB = this.timeStringSwitchNum(nextItem[sortCategory]);

            if (sortA < sortB) {
              swapped = true;
              [sortResult[j], sortResult[j + 1]] = [sortResult[j + 1], sortResult[j]];
            }

          } else {

            if (currentItem[sortCategory] < nextItem[sortCategory] || currentItem[sortCategory] === '--') {
              swapped = true;
              [sortResult[j], sortResult[j + 1]] = [sortResult[j + 1], sortResult[j]];
            }

          }

        }

      }
    }

    this.tableData.relay.group = sortResult;
    this.checkDataLength('group');
  }

  // 依據點選的項目對個人分析進行排序-kidin-1090305
  sortPersonData () {
    this.sortStatus.person = true;

    const sortCategory = this.personSortTable.active,
          sortDirection = this.personSortTable.direction;
    this.sortCategory.person = sortCategory;

    let sortResult = this.tableData.relay.person.slice();
    sortResult = this.getTargetRatio(sortResult, sortCategory, 'person');

    let swapped = true;
    for (let i = 0; i < sortResult.length && swapped; i++) {
      swapped = false;
      for (let j = 0; j < sortResult.length - 1 - i; j++) {
        if (sortDirection === 'asc') {

          if ((sortCategory === 'totalTime' || sortCategory === 'fitTime')) {

            const sortA = this.timeStringSwitchNum(sortResult[j][sortCategory]),
                  sortB = this.timeStringSwitchNum(sortResult[j + 1][sortCategory]);

            if (sortA > sortB) {
              swapped = true;
              [sortResult[j], sortResult[j + 1]] = [sortResult[j + 1], sortResult[j]];
            }

          } else {

            if (sortResult[j][sortCategory] > sortResult[j + 1][sortCategory] || sortResult[j + 1][sortCategory] === '--') {
              swapped = true;
              [sortResult[j], sortResult[j + 1]] = [sortResult[j + 1], sortResult[j]];
            }

          }

        } else {

          if ((sortCategory === 'totalTime' || sortCategory === 'fitTime')) {
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

    this.tableData.relay.person = sortResult;
    this.checkDataLength('person');
  }

  // 將指定類別的數據視覺化呈現-kidin-1090611
  getTargetRatio (data: Array<any>, category: string, type: string) {

    let max = 0; // 取最大值為100%
    for (let i = 0; i < data.length; i++) {

      let _data;
      if (type === 'group') {
        _data = data[i]['data'][category];
      } else {
        _data = data[i][category];
      }

      if (typeof _data === 'string' && _data !== '--') {

        if (this.timeStringSwitchNum(_data) > max) {
          max = this.timeStringSwitchNum(_data);
        }

      } else if (typeof _data === 'number') {

        if (_data > max) {
          max = _data;
        }

      }

    }

    for (let j = 0; j < data.length; j++) {

      let _item;
      if (type === 'group') {
        _item = data[j]['data'];
      } else {
        _item = data[j];
      }

      if (typeof _item[category] === 'string') {

        if (_item[category] === '--') {
          _item.ratio = '0px';
        } else {
          _item.ratio = `${(this.timeStringSwitchNum(_item[category]) / max) * this.getColumnWidth(type)}px`;
        }

      } else {
        _item.ratio = `${(_item[category] / max) * this.getColumnWidth(type)}px`;
      }

    }

    return data;
  }

  // 取得列表欄位大小-kidin-1090611
  getColumnWidth (type: string) {
    if (document.getElementById(`${type}Name`) !== null) {
      return document.getElementById(`${type}Name`).clientWidth;
    } else {
      return 0;
    }

  }

  // 依據點選的群組顯示選單-kidin-1090102
  handleClickGroup (e) {
    this.checkClickEvent = true;
    this.personalMenu.show = false;
    this.personalMenu.focusId = null;

    const groupIdArr = e.currentTarget.id.split('-'),
          currentLen = groupIdArr.length;
    groupIdArr.length = 6;
    const groupId = groupIdArr.fill(0, currentLen, groupIdArr.length).join('-'),
          hashGroupId = this.hashIdService.handleGroupIdEncode(groupId),
          startDateString = this.selectDate.startDate.split('T')[0],
          endDateString = this.selectDate.endDate.split('T')[0];

    this.groupPage = {
      memberList: this.getTargetGroupMemberList(e.currentTarget.id),
      info: `/dashboard/group-info/${hashGroupId}`,
      report: `/dashboard/group-info/${hashGroupId}/com-report?startdate=${startDateString}&enddate=${endDateString}`
    };

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

    this.groupMenu = {
      show: true,
      focusGid: e.currentTarget.id,
      x: menuPosition.x,
      y: menuPosition.y
    };

    this.addScrollListener();
  }

  // 聚焦時，取消滾動或滑動事件-kidin-1090611
  handleScrollEvent (enter: boolean, type: string) {
    this.mouseEnter[type] = enter;
  }

  // 取得目標群組成員名單-kidin-1090610
  getTargetGroupMemberList (groupId: string) {
    const gidLen = groupId.split('-').length;

    if (gidLen === 3) {
      return this.checkMemPrivacy(this.superGroupList[0].member);
    } else if (gidLen === 4) {

      for (let i = 0; i < this.highGroupList.length; i++) {

        if (this.highGroupList[i].gid === groupId) {
          return this.checkMemPrivacy(this.highGroupList[i].member);
        }

      }

    } else if (gidLen === 5) {

      for (let i = 0; i < this.middleGroupList.length; i++) {

        if (this.middleGroupList[i].gid === groupId) {
          return this.checkMemPrivacy(this.middleGroupList[i].member);
        }

      }

    }

  }

  // 確認群組內成員隱私權狀態-kidin-1090619
  checkMemPrivacy (memList: Array<any>) {

    for (let i = 0; i < memList.length; i++) {

      for (let j = 0; j < this.tableData.backUp.person.length; j++) {

        if (+this.tableData.backUp.person[j].userId === memList[i].id) {
          memList[i].passPrivacy = this.tableData.backUp.person[j].passPrivacy;
          break;
        }

      }

    }

    return memList;
  }

  // 導至個人資訊頁-kidin-1090610
  goMemberPage (id) {
    const hashUserId = this.hashIdService.handleUserIdEncode(id);
    window.open(`/user-profile/${hashUserId}`);
  }

  // 依據點選的成員顯示選單-kidin-1090102
  handleClickMember (e) {
    this.checkClickEvent = true;
    this.groupMenu.show = false;
    this.groupMenu.focusGid = null;

    const user = e.currentTarget.id,
          hashUserId = this.hashIdService.handleUserIdEncode(this.lowGroupList[user].id),
          startDateString = this.selectDate.startDate.split('T')[0],
          endDateString = this.selectDate.endDate.split('T')[0];

    this.personalPage = {
      belongGroup: this.getTargetBelongGroup(this.lowGroupList[user].id),
      info: `/user-profile/${hashUserId}`,
      report: `/user-profile/${hashUserId}/sport-report?startdate=${startDateString}&enddate=${endDateString}`
    };

    const menuPosition = {
      x: '',
      y: '',
    };

    // 點選位置太靠右則將選單往左移。
    if (e.view.innerWidth - e.clientX < 270) {
      menuPosition.x = `${e.view.innerWidth - 270}px`;
    } else {
      menuPosition.x = `${e.clientX}px`;
    }

    // 點選位置太靠下則將選單往上移。
    if (e.view.innerHeight - e.clientY < 280) {
      menuPosition.y = `${e.view.innerHeight - 280}px`;
    } else {
      menuPosition.y = `${e.clientY}px`;
    }

    this.personalMenu = {
      show: true,
      focusId: this.lowGroupList[user].id,
      x: menuPosition.x,
      y: menuPosition.y
    };

    this.addScrollListener();
  }

  // 取得目標使用者所屬群組-kidin-1090610
  getTargetBelongGroup (userId: string) {

    for (let i = 0; i < this.lowGroupList.length; i++) {

      if (this.lowGroupList[i].id === userId) {
        return this.lowGroupList[i].belongGroup;
      }

    }

  }

  // 導至群組資訊頁-kidin-1090610
  goGroupPage (gid) {
    const hashGroupId = this.hashIdService.handleGroupIdEncode(gid);
    window.open(`/dashboard/group-info/${hashGroupId}`);
  }

  // 加入滾動/划動監聽器，目前因結構關係無法用HostListener，且目前無法使用removeEventListener移除監聽，待處理-kidin-1090618
  addScrollListener () {
    document.addEventListener('scroll', this.hideMenu.bind(this), true);
  }

  // 加入點擊監聽器-kidin-1090618
  @HostListener ('document:click', [])
  onClick () {
    this.hideMenu();
  }

  // 隱藏群組和個人選單和設定-kidin-1090310
  hideMenu () {

    if (!this.mouseEnter.menu) {

      if (this.checkClickEvent === false) {
        this.groupMenu = {
          show: false,
          focusGid: '',
          x: '',
          y: ''
        };

        this.personalMenu = {
          show: false,
          focusId: null,
          x: '',
          y: ''
        };

      } else {
        this.checkClickEvent = false;
      }

    }

    if (!this.mouseEnter.table) {

      if (this.showTableMenu.group === true) {
        this.showTableMenu.group = false;
        this.saveTableOpt();
      } else if (this.showTableMenu.person === true) {
        this.showTableMenu.person = false;
        this.saveTableOpt();
      }

    }

  }

  // 依照使用者的視窗大小，決定個人分析設定可點選的項目多寡-kidin-1090609
  assignChooseNum (width: number) {
    this.tableTypeListOpt.setMax = 5;
    const defaultCol = {
      group: '0-3-4-6-7', // 預設顯示總人數、人均總時間、效益時間、人均總卡路里、心率圖表
      person: '0-2-5-6-7' // 預設顯示總筆數、總時間、總卡路里、活動偏好、心率圖表
    };

    if (width < 500) {
      this.tableTypeListOpt.setMax = 2;
      this.tableTypeListOpt.setMin = 1;
      defaultCol.group = '0-3'; // 預設顯示總人數、總時間
      defaultCol.person = '0-2';  // 預設顯示總筆數、總時間
    } else if (width < 630) {
      this.tableTypeListOpt.setMax = 3;
      defaultCol.group = '0-3-4'; // 預設顯示總人數、總時間、效益時間
      defaultCol.person = '0-2-5';  // 預設顯示總筆數、總時間、總卡路里
    } else if (width < 950) {
      this.tableTypeListOpt.setMax = 4;
      defaultCol.group = '0-3-4-6'; // 預設顯示總人數、總時間、效益時間、人均總卡路里
      defaultCol.person = '0-2-5-6';  // 預設顯示總筆數、總時間、總卡路里、活動偏好
    }

    this.tableTypeListOpt.tableCheckedNum.group.column = this.tableTypeListOpt.getMax;
    this.tableTypeListOpt.tableCheckedNum.person.column = this.tableTypeListOpt.getMax;

    return defaultCol;
  }

  // 依照群組階層決定可篩選的條件-kidin-1090609
  assignFilter (level: number) {

    const defaultFil = {
      group: '2', // 預設部門
      person: '2', // 預設部門
    };

    switch (level) {
      case 30:
        defaultFil.group = '0-1-2'; // 預設企業+分公司+部門
        defaultFil.person = '0-1-2'; // 預設企業+分公司+部門
        this.tableTypeListOpt.tableCheckedNum.group.filter = 3;
        this.tableTypeListOpt.tableCheckedNum.person.filter = 3;
        break;
      case 40:
        defaultFil.group = '1-2'; // 預設分公司+部門
        defaultFil.person = '1-2'; // 預設分公司+部門
        this.tableTypeListOpt.tableCheckedNum.group.filter = 2;
        this.tableTypeListOpt.tableCheckedNum.person.filter = 2;
        break;
      default:
        defaultFil.group = '2'; // 預設部門
        defaultFil.person = '2'; // 預設部門
        this.tableTypeListOpt.tableCheckedNum.group.filter = 1;
        this.tableTypeListOpt.tableCheckedNum.person.filter = 1;
        break;
    }

    return defaultFil;
  }

  // 顯示團體或個人分析數據類型選單-kidin-1090504
  showTableList (type: string) {
    this.mouseEnter.table = true;
    if (this.showTableMenu.group === false && this.showTableMenu.person === false) {
      this.showTableMenu[type] = true;
    } else if (
      (type === 'group' && this.showTableMenu.group === true)
      || (type === 'person' && this.showTableMenu.person === true)
    ) {
      this.showTableMenu[type] = false;
      this.saveTableOpt();
    } else if (type === 'person' && this.showTableMenu.group === true) {
      this.showTableMenu.group = false;
      this.saveTableOpt();
      this.showTableMenu[type] = true;
    } else {
      this.showTableMenu.person = false;
      this.saveTableOpt();
      this.showTableMenu[type] = true;
    }

    this.addScrollListener();
  }

  // 使用者點擊團體或個人分析checkbox後顯示/隱藏該項目數據-kidin-1090608
  changeTableType (e: any, type: string, func: string) {

    this[`${type}TableTypeList`][func][+e.source.value].checked = e.checked;

    if (e.checked === false) {
      this.tableTypeListOpt.tableCheckedNum[type][func]--;
    } else {
      this.tableTypeListOpt.tableCheckedNum[type][func]++;
    }

    if (func === 'filter') {
      this.filterGroupData(type);
      this.checkDataLength(type);
    }

    this.sortStatus[type] = false;
  }

  // 根據篩選條件過濾數據-kidin-1090609
  filterGroupData (type: string) {

    if (type === 'group') {

      const data = [
        this.superGroupList.slice(),
        this.highGroupList.slice(),
        this.middleGroupList.slice()
      ];
      let filterArr = [];
      for (let i = 0; i < this.groupTableTypeList.filter.length; i++) {

        if (this.groupTableTypeList.filter[i].checked) {
          filterArr = filterArr.concat(data[i]);
        }

      }

      this.tableData.backUp.group = filterArr;
      this.tableData.relay.group = this.tableData.backUp.group.slice();
      this.showAll.group = false;
      this.checkDataLength('group');
    } else if (type === 'person') {

      const filterAddition = [];
      for (let i = 0; i < this.personTableTypeList.filter.length; i++) {

        if (!this.personTableTypeList.filter[i].checked) {
          filterAddition.push(i);
        }

      }

      const filterData = this.tableData.backUp.person.slice();
      this.tableData.relay.person = filterData.filter(data => {

        let pass = false;
        for (let j = 0; j < data.belongGroup.length; j++) {

          const filterGid = data.belongGroup[j].gid;
          switch (filterAddition.join('-')) {
            case '0-1': // 只顯示部門

              if (`${this.getPartGroupId(filterGid, 5)}-0` !== `${this.getPartGroupId(filterGid, 4)}-0-0`) {
                pass = true;
              }
              break;

            case '0-2': // 只顯示分公司

              if (
                `${this.getPartGroupId(filterGid, 3)}-0-0-0` !== `${this.getPartGroupId(filterGid, 4)}-0-0`
                && `${this.getPartGroupId(filterGid, 4)}-0-0` === `${this.getPartGroupId(filterGid, 5)}-0`
              ) {
                pass = true;
              }
              break;

            case '0': // 顯示分公司+部門
              if (`${this.getPartGroupId(filterGid, 3)}-0-0-0` !== `${this.getPartGroupId(filterGid, 5)}-0`) {
                pass = true;
              }
              break;

            case '1-2': // 只顯示企業
              if (`${this.getPartGroupId(filterGid, 3)}-0-0-0` === `${this.getPartGroupId(filterGid, 5)}-0`) {
                pass = true;
              }
              break;

            case '1': // 顯示企業+部門
              if (!(
                `${this.getPartGroupId(filterGid, 3)}-0-0-0` !== `${this.getPartGroupId(filterGid, 4)}-0-0`
                && `${this.getPartGroupId(filterGid, 4)}-0-0` === `${this.getPartGroupId(filterGid, 5)}-0`
              )) {
                pass = true;
              }
              break;

            case '2': // 顯示企業+分公司
              if (`${this.getPartGroupId(filterGid, 5)}-0` === `${this.getPartGroupId(filterGid, 4)}-0-0`) {
                pass = true;
              }
              break;

            default:  // 全顯示
              pass = true;
              break;
          }

        }

        return pass;
      });

      this.showAll.person = false;
    } else {
      this.filterGroupData('group');
      this.filterGroupData('person');
    }

  }

  // 將群組分析和個人分析的設定存入localstorage-kidin-1090608
  saveTableOpt () {

    const gFilArr = [],
          gColArr = [],
          pFilArr = [],
          pColArr = [];

    for (let i = 0; i < this.groupTableTypeList.filter.length; i++) {

      if (this.groupTableTypeList.filter[i].checked === true) {
        gFilArr.push(this.groupTableTypeList.filter[i].id);
      }

    }

    for (let j = 0; j < this.groupTableTypeList.column.length; j++) {

      if (this.groupTableTypeList.column[j].checked === true) {
        gColArr.push(this.groupTableTypeList.column[j].id);
      }

    }


    for (let k = 0; k < this.personTableTypeList.filter.length; k++) {

      if (this.personTableTypeList.filter[k].checked === true) {
        pFilArr.push(this.personTableTypeList.filter[k].id);
      }

    }

    for (let l = 0; l < this.personTableTypeList.column.length; l++) {

      if (this.personTableTypeList.column[l].checked === true) {
        pColArr.push(this.personTableTypeList.column[l].id);
      }

    }

    const opt = {
      group: {
        filter: gFilArr.join('-'),
        column: gColArr.join('-')
      },
      person: {
        filter: pFilArr.join('-'),
        column: pColArr.join('-')
      }
    };

    this.utilsService.setLocalStorageObject('reportTableOpt', JSON.stringify(opt));
  }

  // 讀取localstorage來取得群組分析和個人分析的設定-kidin-1090608
  getTableOpt () {
    const defaultCol = this.assignChooseNum(document.body.clientWidth),
          defaultFil = this.assignFilter(+this.groupLevel),
          optStr: string = this.utilsService.getLocalStorageObject('reportTableOpt') || '';
    let gFilOpt: Array<string>,
        gColOpt: Array<string>,
        pFilOpt: Array<string>,
        pColOpt: Array<string>;
    if (optStr.length === 0) {
      gFilOpt = defaultFil.group.split('-'),
      gColOpt = defaultCol.group.split('-'),
      pFilOpt = defaultFil.person.split('-'),
      pColOpt = defaultCol.person.split('-');

      setTimeout(() => {  // 待下方迴圈跑完再存設定
        this.saveTableOpt();
      });

    } else {
      const opt = JSON.parse(optStr);
      gColOpt = opt.group.column.split('-');
      pColOpt = opt.person.column.split('-');

      this.tableTypeListOpt.tableCheckedNum.group.column = gColOpt.length;
      this.tableTypeListOpt.tableCheckedNum.person.column = pColOpt.length;

      if (+this.groupLevel <= 30) {
        gFilOpt = opt.group.filter.split('-');
        pFilOpt = opt.person.filter.split('-');
        this.tableTypeListOpt.tableCheckedNum.group.filter = gFilOpt.length;
        this.tableTypeListOpt.tableCheckedNum.person.filter = pFilOpt.length;
      } else if (+this.groupLevel <= 40) {
        this.tableTypeListOpt.tableCheckedNum.group.filter = 2;
        this.tableTypeListOpt.tableCheckedNum.person.filter = 2;
        gFilOpt = ['1', '2'];
        pFilOpt = ['1', '2'];
      } else {
        this.tableTypeListOpt.tableCheckedNum.group.filter = 1;
        this.tableTypeListOpt.tableCheckedNum.person.filter = 1;
        gFilOpt = ['2'];
        pFilOpt = ['2'];
      }

    }

    for (let i = 0; i < gFilOpt.length; i++) {
      this.groupTableTypeList.filter[+gFilOpt[i]].checked = true;
    }

    for (let j = 0; j < gColOpt.length; j++) {

      if (this.groupTableTypeList.column[+gColOpt[j]].id !== 2 || this.diffDay > 52) {
        this.groupTableTypeList.column[+gColOpt[j]].checked = true;
      } else {
        this.tableTypeListOpt.tableCheckedNum.group.column--;
      }

    }


    for (let k = 0; k < pFilOpt.length; k++) {
      this.personTableTypeList.filter[+pFilOpt[k]].checked = true;
    }

    for (let l = 0; l < pColOpt.length; l++) {

      if (this.personTableTypeList.column[+pColOpt[l]].id !== 1 || this.diffDay > 52) {
        this.personTableTypeList.column[+pColOpt[l]].checked = true;
      } else {
        this.tableTypeListOpt.tableCheckedNum.person.column--;
      }

    }

    this.filterGroupData('all');
    this.checkDataLength('all');
  }

  // 將時間字串轉數字(分鐘)-kidin-1090401
  timeStringSwitchNum (time: string) {

    if (time === '-:--') {
      return 0;
    } else {
      const min = (+time.split(':')[0] * 60) + +time.split(':')[1];
      return min;
    }

  }

  print() {
    window.print();
  }

  // 離開頁面時將rxjs儲存的資料初始化-kidin-1090213
  ngOnDestroy () {
    this.showReport = false;

    // 將之前生成的highchart卸除避免新生成的highchart無法顯示-kidin-1081219
    Highcharts.charts.forEach((_highChart, idx) => {
      if (_highChart !== undefined) {
        _highChart.destroy();
      }
    });

  }

}
