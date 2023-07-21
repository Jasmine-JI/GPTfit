import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api41xxService, AuthService } from '../../../core/services';
import { Api4103Post, Api4103Response } from '../../../core/models/api/api-41xx';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { checkResponse, getDevicTypeInfo } from '../../../core/utils';
import { TranslateModule } from '@ngx-translate/core';
import { professionalIconSubstitudePath } from '../../../core/models/const';
import {
  GroupCommercePlan,
  TimeFormatPipe,
  GroupLevelNamePipe,
  CommerceOperationStatusPipe,
} from '../../../core/pipes';
import { HashIdService } from '../../../core/services';
import { PaginationSetting } from '../../../core/models/compo/pagination.model';
import {
  PaginationComponent,
  PageRoadPathComponent,
  OperationListConditionComponent,
} from '../../../components';
import {
  RoadPath,
  AllOperationCondition,
  OperationConditionResult,
} from '../../../core/models/compo';
import {
  ExpiredStatus,
  GroupListSortType,
  BrandType,
  CondtionType,
} from '../../../core/enums/compo';
import { DescFirstSortDirection } from '../../../core/enums/api';
import { CommerceStatus, CommercePlan } from '../../../core/enums/professional';
import { appPath } from '../../../app-path.const';

@Component({
  selector: 'app-group-operation-list',
  templateUrl: './group-operation-list.component.html',
  styleUrls: ['./group-operation-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    GroupCommercePlan,
    TimeFormatPipe,
    GroupLevelNamePipe,
    CommerceOperationStatusPipe,
    PaginationComponent,
    PageRoadPathComponent,
    OperationListConditionComponent,
  ],
})
export class GroupOperationListComponent implements OnInit {
  /**
   * 資料最後更新時間
   */
  lastUpdateTime$: Observable<any>;

  /**
   * api 4103 post
   */
  post: Api4103Post = {
    token: this.authService.token,
    filter: {
      commerceStatus: 0,
      brandType: 0,
      plan: 0,
      expiredStatus: 0,
      brandKeyword: '',
    },
    sort: {
      type: 1,
      direction: 1,
    },
    page: {
      index: 0,
      counts: 10,
    },
  };

  list$: Observable<Array<any>>;
  page$: Observable<PaginationSetting> = of({
    totalCounts: 0,
    pageIndex: 0,
    onePageSize: 10,
  });

  pathList: RoadPath = [
    {
      title: '系統營運分析報告',
      url: `/${appPath.dashboard.home}/${appPath.adminManage.home}/${appPath.adminManage.systemOperationReport}`,
    },
    {
      title: '群組分析列表',
      url: `/${appPath.dashboard.home}/${appPath.adminManage.home}/${appPath.adminManage.groupOperationList}`,
    },
  ];

  /**
   * 載入進度
   */
  progress = 100;

  readonly professionalIconSubstitudePath = professionalIconSubstitudePath;
  readonly currentTimestamp = new Date().valueOf();
  readonly allOperationCondition: AllOperationCondition = {
    conditionList: [
      {
        type: 'dropList',
        titleTranslateKey: '營運狀態',
        conditionCode: CondtionType.commerceStatus,
        conditionItemList: [
          { textKey: 'universal_adjective_all', value: CommerceStatus.all },
          { textKey: 'universal_group_InOperation', value: CommerceStatus.inOperation },
          { textKey: 'universal_group_outOfService', value: CommerceStatus.pauseOperation },
          { textKey: 'universal_group_outOfBusiness', value: CommerceStatus.closed },
          { textKey: 'universal_group_toBeDestroyed', value: CommerceStatus.pendingLogout },
        ],
      },
      {
        type: 'dropList',
        titleTranslateKey: '群組類別',
        conditionCode: CondtionType.brandType,
        conditionItemList: [
          { textKey: 'universal_adjective_all', value: BrandType.all },
          { textKey: 'universal_group_brand', value: BrandType.brand },
          { textKey: 'universal_group_enterprise', value: BrandType.enterprise },
        ],
      },
      {
        type: 'dropList',
        titleTranslateKey: '方案類別',
        conditionCode: CondtionType.planType,
        conditionItemList: [
          { textKey: 'universal_adjective_all', value: CommercePlan.all },
          { textKey: 'universal_group_experiencePlan', value: CommercePlan.tryOut },
          { textKey: 'universal_group_studioPlan', value: CommercePlan.studio },
          { textKey: 'universal_group_smePlan', value: CommercePlan.company },
          { textKey: '大型企業方案', value: CommercePlan.enterprise },
          { textKey: '跨國企業方案', value: CommercePlan.multinational },
          { textKey: 'universal_group_customPlan', value: CommercePlan.custom },
        ],
      },
      {
        type: 'dropList',
        titleTranslateKey: '授權狀態',
        conditionCode: CondtionType.expiredStatus,
        conditionItemList: [
          { textKey: 'universal_adjective_all', value: ExpiredStatus.all },
          { textKey: '未到期', value: ExpiredStatus.notExpire },
          { textKey: '已到期', value: ExpiredStatus.expired },
        ],
      },
      {
        type: 'keyword',
        titleTranslateKey: 'universal_activityData_keyword',
        conditionCode: CondtionType.keyword,
      },
    ],
    sortTypeList: {
      list: [
        {
          textKey: 'universal_vocabulary_creationDate',
          value: GroupListSortType.creationTime,
        },
        {
          textKey: 'universal_group_authorizationDueDate',
          value: GroupListSortType.expiredTime,
        },
        { textKey: '會員數', value: GroupListSortType.totalMembers },
        { textKey: '會員限制數', value: GroupListSortType.memberLimitation },
      ],
      initIndex: GroupListSortType.creationTime - 1,
    },
    sortDirection: {
      list: [
        {
          textKey: 'universal_activityData_powerDown',
          value: DescFirstSortDirection.desc,
        },
        {
          textKey: 'universal_activityData_ascendingPower',
          value: DescFirstSortDirection.asc,
        },
      ],
      initIndex: DescFirstSortDirection.desc - 1,
    },
  };

  constructor(
    private api41xxService: Api41xxService,
    private authService: AuthService,
    private hashIdService: HashIdService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getDataUpdateTime();
  }

  /**
   * 取得資料最後更新時間
   */
  getDataUpdateTime() {
    const body = {
      token: this.authService.token,
      groupId: '0-0-0-0-0-0',
    };
    this.lastUpdateTime$ = this.api41xxService.fetchGetUpdateAnalysisDataStatus(body);
  }

  /**
   * 取得群組列表
   */
  getList() {
    if (this.progress === 100) {
      this.progress = 30;
      this.api41xxService
        .fetchGetBrandOperationInfoList(this.post)
        .pipe(
          tap((res) => {
            const { info, totalCounts } = this.getEffectResponse(res);
            const { index, counts } = this.post.page;
            this.page$ = of({
              totalCounts,
              pageIndex: index,
              onePageSize: counts,
            });
            this.list$ = of(info);
            this.changeDetectorRef.markForCheck();
          })
        )
        .subscribe((res) => {
          this.progress = 100;
        });
    }
  }

  /**
   * 取得有效的回覆資訊
   * @param res {Api4103Response}-api 4103 response
   */
  getEffectResponse(res: Api4103Response) {
    if (!checkResponse(res)) {
      return { info: [], totalCounts: 0 };
    } else {
      const { totalCounts, info } = res;
      return { info: this.processingList(info), totalCounts };
    }
  }

  /**
   * 將清單進行加工，包含
   * 1. 裝置型號排序
   * 2. 裝置使用次數 cjson 還原為一般 json
   * 3. 插入unfold status方便處理展開收合功能
   * 4. 插入相關連結
   * @param list {Array<any>}-api 4103 response 的 info 物件
   */
  processingList(list: Array<any>) {
    return list.map((_list) => {
      const {
        baseInfo: { groupId },
        device: { modelTypeList, countsFieldName, countsFieldValue },
      } = _list;
      _list.device.useCounts = this.handleDeviceCjson(countsFieldName, countsFieldValue);
      _list.device.modelTypeList = modelTypeList.sort();
      _list.link = this.getRelativeLink(groupId);
      _list.unfold = false;
      return _list;
    });
  }

  /**
   * 將cjson資訊處理成
   * @param fieldName {Array<string>}
   * @param fieldValue {Array<number>}
   */
  handleDeviceCjson(fieldName: Array<string>, fieldValue: Array<number>) {
    return fieldName.map((_name, _index) => {
      const _translateKey = getDevicTypeInfo(_name.split('d')[1], 'key');
      return [_translateKey, fieldValue[_index]];
    });
  }

  /**
   * 根據群組id，取得相關連結
   * @param groupId {string}-群組編號
   */
  getRelativeLink(groupId: string) {
    const {
      dashboard: { home: dashboardHome },
      professional: { groupDetail },
    } = appPath;
    const hashGroupId = this.hashIdService.handleGroupIdEncode(groupId);
    const baseUrl = `/${dashboardHome}/${groupDetail.home}/${hashGroupId}`;
    return {
      introduction: `${baseUrl}/group-introduction`,
      commerce: `${baseUrl}/commerce-plan`,
      operation: `${baseUrl}/operation-report`,
    };
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

  /**
   * 切換分頁
   * @param e {PaginationSetting}-分頁資訊
   */
  shiftPage(e: PaginationSetting) {
    this.page$ = of(e);
    const { pageIndex, onePageSize } = e;
    this.post.page = {
      counts: onePageSize,
      index: pageIndex,
    };

    this.getList();
  }

  /**
   * 變更列表條件或排序
   * @param condition {OperationConditionResult}-條件與排序設定
   */
  changeCondition(condition: OperationConditionResult) {
    const { conditionList, sortDirection, sortType } = condition;
    conditionList.forEach((_list) => {
      const { conditionCode, selectedCode, keyword, value } = _list;
      switch (conditionCode) {
        case CondtionType.commerceStatus:
          this.post.filter.commerceStatus = (value ?? selectedCode) as number;
          break;
        case CondtionType.brandType:
          this.post.filter.brandType = (value ?? selectedCode) as number;
          break;
        case CondtionType.planType:
          this.post.filter.plan = (value ?? selectedCode) as number;
          break;
        case CondtionType.expiredStatus:
          this.post.filter.expiredStatus = (value ?? selectedCode) as number;
          break;
        case CondtionType.keyword:
          this.post.filter.brandKeyword = keyword as string;
          break;
      }
    });

    const { page } = this.post;
    this.post = {
      ...this.post,
      page: {
        index: 0,
        counts: page.counts,
      },
      sort: {
        direction: sortDirection,
        type: sortType,
      },
    };

    this.getList();
  }
}
