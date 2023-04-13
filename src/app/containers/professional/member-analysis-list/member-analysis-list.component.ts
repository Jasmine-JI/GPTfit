import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Api41xxService, HashIdService } from '../../../core/services';
import { Api4106Post, Api4106Response } from '../../../core/models/api/api-41xx';
import { Observable, of } from 'rxjs';
import { tap, last } from 'rxjs/operators';
import { PaginationSetting } from '../../../shared/models/pagination';
import { PaginationComponent, OperationListConditionComponent } from '../../../components';
import { AllOperationCondition, OperationConditionResult } from '../../../core/models/compo';
import {
  SortDirection,
  CondtionType,
  MemberListSortType,
  MemberType,
} from '../../../core/enums/compo';
import { Gender } from '../../../core/enums/personal';
import { GroupLevel } from '../../../core/enums/professional';
import { SportType } from '../../../core/enums/sports';
import {
  SexPipe,
  AgePipe,
  TimeFormatPipe,
  SpaceTrimPipe,
  SportTypePipe,
  ProductTypePipe,
} from '../../../core/pipes';
import { personalIconSubstitudePath } from '../../../core/models/const';
import { checkResponse, deepCopy, countAge } from '../../../core/utils';
import { GroupArchitecture } from '../../dashboard/models/group-detail';

const defaultPagination: PaginationSetting = {
  totalCounts: 0,
  pageIndex: 0,
  onePageSize: 10,
};

@Component({
  selector: 'app-member-analysis-list',
  templateUrl: './member-analysis-list.component.html',
  styleUrls: ['./member-analysis-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    PaginationComponent,
    OperationListConditionComponent,
    SexPipe,
    AgePipe,
    TimeFormatPipe,
    SpaceTrimPipe,
    SportTypePipe,
    ProductTypePipe,
  ],
})
export class MemberAnalysisListComponent implements OnInit, OnChanges {
  @Input() post: Api4106Post;
  @Input() groupList: GroupArchitecture;

  /**
   * 教練篩選條件
   */
  readonly coachCondition = [
    {
      type: 'dropList' as any,
      titleTranslateKey: 'universal_userProfile_gender',
      conditionCode: CondtionType.gender,
      conditionItemList: [
        { textKey: 'universal_adjective_all', value: Gender.unlimit },
        { textKey: 'universal_userProfile_male', value: Gender.male },
        { textKey: 'universal_userProfile_female', value: Gender.female },
      ],
    },
    {
      type: 'dropList' as any,
      titleTranslateKey: 'universal_activityData_type',
      conditionCode: CondtionType.teachType,
      conditionItemList: [
        { textKey: 'universal_adjective_all', value: SportType.all },
        { textKey: 'universal_activityData_run', value: SportType.run },
        { textKey: 'universal_activityData_cycle', value: SportType.cycle },
        { textKey: 'universal_activityData_weightTraining', value: SportType.weightTrain },
        { textKey: 'universal_activityData_aerobic', value: SportType.aerobic },
        { textKey: 'universal_sportsName_boating', value: SportType.row },
        { textKey: 'universal_activityData_complex', value: SportType.complex },
      ],
    },
    {
      type: 'keyword' as any,
      titleTranslateKey: 'universal_activityData_keyword',
      conditionCode: CondtionType.keyword,
    },
  ];

  /**
   * 學員篩選條件
   */
  readonly memberCondition = [
    {
      type: 'dropList',
      titleTranslateKey: 'universal_userProfile_gender',
      conditionCode: CondtionType.gender,
      conditionItemList: [
        { textKey: 'universal_adjective_all', value: Gender.unlimit },
        { textKey: 'universal_userProfile_male', value: Gender.male },
        { textKey: 'universal_userProfile_female', value: Gender.female },
      ],
    },
    {
      type: 'dropList',
      titleTranslateKey: 'universal_userProfile_age',
      conditionCode: CondtionType.age,
      conditionItemList: [
        { textKey: 'universal_adjective_all', value: null },
        { textKey: '0-20', value: [0, 20] },
        { textKey: '21-30', value: [21, 30] },
        { textKey: '31-40', value: [31, 40] },
        { textKey: '41-50', value: [41, 50] },
        { textKey: '51-60', value: [51, 60] },
        { textKey: '61-100', value: [61, 100] },
      ],
    },
    {
      type: 'keyword',
      titleTranslateKey: 'universal_activityData_keyword',
      conditionCode: CondtionType.keyword,
    },
  ];

  /**
   * 教練排序類別
   */
  readonly coachSortType = [
    {
      textKey: 'universal_activityData_name',
      value: MemberListSortType.name,
    },
    {
      textKey: 'universal_userProfile_gender',
      value: MemberListSortType.gender,
    },
    { textKey: 'universal_userProfile_age', value: MemberListSortType.age },
    { textKey: 'universal_group_totalClassAmount', value: MemberListSortType.totalTeachCounts },
    { textKey: '累計上課人次', value: MemberListSortType.totalStudentsCounts },
    { textKey: 'universal_group_lastClassDate', value: MemberListSortType.lastTeachTime },
  ];

  /**
   * 學員排序類別
   */
  readonly memberSortType = [
    {
      textKey: 'universal_activityData_name',
      value: MemberListSortType.name,
    },
    {
      textKey: 'universal_userProfile_gender',
      value: MemberListSortType.gender,
    },
    { textKey: 'universal_userProfile_age', value: MemberListSortType.age },
    { textKey: '累計上課次數', value: MemberListSortType.totalAttendCounts },
    { textKey: '累計上課時數', value: MemberListSortType.totalAttendHour },
    { textKey: '最後上課日', value: MemberListSortType.lastAttendTime },
  ];

  readonly MemberType = MemberType;
  readonly personalIconSubstitudePath = personalIconSubstitudePath;

  list$: Observable<Array<any>>;
  pageSetting: PaginationSetting = {
    totalCounts: 0,
    pageIndex: 0,
    onePageSize: 10,
  };

  /**
   * 清單資料原型，避免因篩選、排序、分頁後需要回復最初的資料
   */
  backupList: Array<any>;

  /**
   * 清單篩選類別
   */
  listCondition: OperationConditionResult;

  allOperationCondition: AllOperationCondition = {
    conditionList: this.coachCondition,
    sortTypeList: {
      list: this.coachSortType,
      initIndex: MemberListSortType.name - 1,
    },
    sortDirection: {
      list: [
        {
          textKey: 'universal_activityData_powerDown',
          value: SortDirection.desc,
        },
        {
          textKey: 'universal_activityData_ascendingPower',
          value: SortDirection.asc,
        },
      ],
      initIndex: SortDirection.desc - 1,
    },
  };

  /**
   * 載入進度
   */
  progress = 100;

  constructor(private api41xxService: Api41xxService, private hashIdService: HashIdService) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    const { post } = changes;
    if (post) {
      const { type, groupLevel } = post.currentValue;
      const { coachSortType, memberSortType } = this;
      const isAdminList = type === 1;
      Object.assign(this.allOperationCondition, {
        conditionList: this.getConditionList(isAdminList, groupLevel),
        sortTypeList: { list: isAdminList ? coachSortType : memberSortType, initIndex: 0 },
      });
      this.getMemberList();
    }
  }

  /**
   * 取得條件清單
   * @param isAdminList {boolean}-是否為管理員清單
   * @param groupLevel {GroupLevel}-群組階層
   */
  getConditionList(isAdminList: boolean, groupLevel: GroupLevel): any {
    const { coachCondition, memberCondition } = this;
    const referenceList = isAdminList ? coachCondition : memberCondition;
    if (groupLevel < GroupLevel.class) {
      referenceList.unshift(this.getGroupConditionList());
    }

    return referenceList;
  }

  /**
   * 取得群組篩選條件清單，並轉為條件篩選元件介接格式
   */
  getGroupConditionList() {
    const {
      post: { groupLevel },
      groupList,
    } = this;
    const referenceList = {
      [GroupLevel.brand]: groupList.branches,
      [GroupLevel.branch]: groupList.coaches,
    };

    const groupConditoin = {
      type: 'dropList' as any,
      titleTranslateKey: 'universal_group_group',
      conditionCode: CondtionType.childName,
      conditionItemList: [{ textKey: 'universal_adjective_all', value: null }],
    };
    groupConditoin.conditionItemList = groupConditoin.conditionItemList.concat(
      (referenceList[groupLevel] ?? []).map((_list) => {
        const { groupName } = _list;
        return { textKey: groupName, value: groupName };
      })
    );

    return groupConditoin;
  }

  /**
   * 取得人員列表
   */
  getMemberList() {
    if (this.post) {
      this.api41xxService
        .fetchGetGroupMemberAnalysisList(this.post)
        .pipe(
          tap((res) => {
            const { info } = this.getEffectResponse(res);
            const totalCounts = info?.length ?? 0;
            this.pageSetting = { ...this.pageSetting, totalCounts };
            this.backupList = deepCopy(info);
            this.list$ = this.createFinalList();
          })
        )
        .subscribe();
    }
  }

  /**
   * 取得有效的回覆資訊
   * @param res {Api4106Response}-api 4106 response
   */
  getEffectResponse(res: Api4106Response) {
    return !checkResponse(res)
      ? { info: [], totalCounts: 0 }
      : { info: this.processingList(res.info) };
  }

  /**
   * 將清單進行加工，包含
   * 1. 插入unfold status方便處理展開收合功能
   * 2. 插入相關連結
   * @param list {Array<any>}-api 4103 response 的 info 物件
   */
  processingList(list: Array<any>) {
    return list.map((_list) => {
      const {
        baseInfo: { userId },
      } = _list;

      _list.link = this.getRelativeLink(userId);
      _list.unfold = false;
      return _list;
    });
  }

  /**
   * 根據群組id，取得相關連結
   * @param userId {string}-群組編號
   */
  getRelativeLink(userId: string) {
    const hashUserId = this.hashIdService.handleUserIdEncode(userId);
    return {
      introduction: `/user-profile/${hashUserId}/info`,
      sportsReport: `/user-profile/${hashUserId}/sport-report`,
    };
  }

  /**
   * 將清單依條件篩選、排序、分頁
   */
  createFinalList() {
    const filterList = this.filterList();
    const listLength = filterList.length;
    this.pageSetting = { ...this.pageSetting, totalCounts: listLength };
    return of(this.handlePagination(filterList));
  }

  /**
   * 將所有清單進行分頁
   * @param list {Array<any>}-資料清單
   */
  handlePagination(list: Array<any>) {
    const { pageIndex, onePageSize } = this.pageSetting;
    const startIndex = pageIndex * onePageSize;
    const endIndex = (pageIndex + 1) * onePageSize;
    return list.slice(startIndex, endIndex);
  }

  /**
   * 變更列表條件或排序
   * @param condition {OperationConditionResult}-條件與排序設定
   */
  changeCondition(condition: OperationConditionResult) {
    this.listCondition = condition;
    this.list$ = this.createFinalList();
  }

  /**
   * 根據條件篩選清單，最後進行排序
   */
  filterList() {
    const { backupList, listCondition: { conditionList = [], sortDirection, sortType } = {} } =
      this;
    if (!backupList) return [];

    const matchGender = ({ baseInfo: { gender }, value }) => {
      if (value === undefined) return true;
      return [Gender.unlimit, gender].includes(value);
    };

    const matchGroupName = ({ groupBelonging, value }) => {
      if (!value) return true;
      const { groupLevel } = this.post;
      // 僅只能篩選下一個階層的群組
      const compareName = {
        [GroupLevel.brand]: 'branchName',
        [GroupLevel.branch]: 'className',
      };

      return groupBelonging.some((_group) => _group[compareName[groupLevel]] === value);
    };

    const matchSportsType = ({ classInfo, attendInfo, value }) => {
      if (value === undefined) return true;
      const { type } = this.post;
      const typeReference = type === 1 ? classInfo.teachType : attendInfo.attendClassType;
      return value === SportType.all || typeReference.some((_type) => +_type === value);
    };

    const matchKeyWord = ({ baseInfo: { userName }, keyword }) =>
      !keyword || userName.includes(keyword);

    const matchAge = ({ baseInfo: { birthday }, value }) => {
      if (!value) return true;
      const [startAge, endAge] = value;
      const age = countAge(birthday);
      return age >= startAge && age <= endAge;
    };

    const conditionFunctions = {
      [CondtionType.gender]: matchGender,
      [CondtionType.childName]: matchGroupName.bind(this),
      [CondtionType.teachType]: matchSportsType.bind(this),
      [CondtionType.keyword]: matchKeyWord,
      [CondtionType.age]: matchAge,
    };

    return deepCopy(backupList)
      .filter((_list) =>
        conditionList.every(({ conditionCode, value, ...rest }) =>
          conditionFunctions[conditionCode]({ ..._list, value, ...rest })
        )
      )
      .sort((_a, _b) => this.sortList({ aValue: _a, bValue: _b, sortType, sortDirection }));
  }

  /**
   * 根據排序條件將清單排序
   * @param { aValue: any; bValue: any; sortType: MemberListSortType; sortDirection: SortDirection; }
   */
  sortList({ aValue, bValue, sortType, sortDirection }) {
    const sortName = (a, b) => {
      const aName = a.baseInfo.userName;
      const bName = b.baseInfo.userName;
      if (aName > bName) return 1;
      if (aName < bName) return -1;
      if (aName === bName) return 0;
    };
    const sortGender = (a, b) => a.baseInfo.gender - b.baseInfo.gender;
    const sortAge = (a, b) => +b.baseInfo.birthday - +a.baseInfo.birthday; // 生日數字越小年齡越大
    const sortTotalTeachCounts = (a, b) =>
      a.classInfo.totalTeachCounts - b.classInfo.totalTeachCounts;
    const sortTotalStudentsCounts = (a, b) => {
      const { maleAttendCounts: aMaleAttendCounts, femaleAttendCounts: aFemaleAttendCounts } =
        a.classInfo;
      const { maleAttendCounts: bMaleAttendCounts, femaleAttendCounts: bFemaleAttendCounts } =
        b.classInfo;
      return aMaleAttendCounts + aFemaleAttendCounts - (bMaleAttendCounts + bFemaleAttendCounts);
    };
    const sortLastTeachTime = (a, b) => a.classInfo.lastTeachDate - b.classInfo.lastTeachDate;
    const sortTotalAttendCounts = (a, b) =>
      a.attendInfo.totalAttendCounts - b.attendInfo.totalAttendCounts;
    const sortTotalAttendHour = (a, b) =>
      a.attendInfo.totalAttendTime - b.attendInfo.totalAttendTime;
    const sortLastAttendTime = (a, b) => a.attendInfo.lastAttendDate - b.attendInfo.lastAttendDate;
    const sortCondition = {
      [MemberListSortType.name]: sortName,
      [MemberListSortType.gender]: sortGender,
      [MemberListSortType.age]: sortAge,
      [MemberListSortType.totalTeachCounts]: sortTotalTeachCounts,
      [MemberListSortType.totalStudentsCounts]: sortTotalStudentsCounts,
      [MemberListSortType.lastTeachTime]: sortLastTeachTime,
      [MemberListSortType.totalAttendCounts]: sortTotalAttendCounts,
      [MemberListSortType.totalAttendHour]: sortTotalAttendHour,
      [MemberListSortType.lastAttendTime]: sortLastAttendTime,
    };

    const sortDirectionValue = sortDirection === SortDirection.desc ? -1 : 1;
    return sortCondition[sortType](aValue, bValue) * sortDirectionValue;
  }

  /**
   * 切換分頁
   * @param e {PaginationSetting}-分頁資訊
   */
  shiftPage(e: PaginationSetting) {
    this.pageSetting = deepCopy(e);
    this.list$ = this.createFinalList();
  }

  /**
   * 處理展開收合狀態
   * @param e {MouseEvent}
   * @param item {any}-清單項目
   */
  handleUnfoldItem(e: MouseEvent, item: any) {
    e.stopPropagation();
    const { unfold } = item;
    return !unfold;
  }
}
