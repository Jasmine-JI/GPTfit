import { Component, OnInit, OnDestroy } from '@angular/core';
import { OfficialActivityService } from '../../services/official-activity.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilsService } from '../../../../shared/services/utils.service';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { formTest } from '../../../../shared/models/form-test';
import { Subject, Subscription, fromEvent, combineLatest, merge, of } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { pageNotFoundPath, officialHomePage } from '../../models/official-activity-const';
import { CloudrunService } from '../../../../shared/services/cloudrun.service';
import { RankType } from '../../../../shared/models/cloudrun-leaderboard';
import { ProductShipped, HaveProduct, ApplyStatus, PaidStatusEnum, Nationality } from '../../models/activity-content';
import moment from 'moment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaidStatusPipe } from '../../pipes/paid-status.pipe';
import { ShippedStatusPipe } from '../../pipes/shipped-status.pipe';
import { TranslateService } from '@ngx-translate/core';
import { Sex } from '../../../dashboard/models/userProfileInfo';
import { AgePipe } from '../../../../shared/pipes/age.pipe';


type SortType = 'rank' | 'group' | 'paidStatus' | 'orderStatus' | 'awardStatus' | 'paidDate' | 'shippedDate';
type SortSequence = 'asc' | 'desc';
type ShippedType = 'productShipped' | 'awardShipped';
type ListType = 'normal' | 'leave';
type ProfileEditType = 
    'truthName'
  | 'address'
  | 'remark'
  | 'name'
  | 'relationship'
  | 'mobileNumber';

interface SortSet {
  type: SortType;
  order: SortSequence;
}

const defaultSortSet = <SortSet>{
  type: 'rank',
  order: 'asc'
};

@Component({
  selector: 'app-contestant-list',
  templateUrl: './contestant-list.component.html',
  styleUrls: ['./contestant-list.component.scss']
})
export class ContestantListComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  private resizeSubscription = new Subscription;
  private clickScrollEvent = new Subscription;

  /**
   * ui會用到的flag
   */
  uiFlag = {
    progress: 100,
    showFilterSelector: false,
    focusList: null,
    expandDetail: null,
    showGroupList: null,
    showPaidStatusSelector: null,
    showOrderStatusSelector: null,
    showAwardStatusSelector: null,
    detailEditable: false,
    screenSize: window.innerWidth,
    deleteMode: false,
    showSortMenu: false,
    focusInput: false
  };

  sortSet = <SortSet>{
    type: 'rank',
    order: 'asc'
  };

  /**
   * api 6006 req
   */
  searchInfo = {
    token: null,
    targetEventId: null,
    page: {
      index: 0,
      counts: 100
    }
  };

  /**
   * 清單篩選條件
   */
  listFilter = {
    type: <SortType>null,
    value: null,
    groupName: null
  };

  /**
   * 清單排序依據
   */
  listArrange = {
    type: <SortType>'rank',
    action: <SortSequence>'asc'
  }

  /**
   * 組別
   */
  groupList: any;


  serverTimeDiff = null;
  token: string;
  eventId: number;
  eventInfo: any;
  leaderboard: any;
  participantList: Array<any>;
  allMapInfo: Array<any>;
  reArrangeList = [];
  backupLeaveList = [];
  leaveList = [];
  readonly mapIconPath = '/app/public_html/cloudrun/update/';
  readonly ProductShipped = ProductShipped;
  readonly PaidStatusEnum = PaidStatusEnum;
  readonly Nationality = Nationality;

  constructor(
    private officialActivityService: OfficialActivityService,
    private activatedRoute: ActivatedRoute,
    private utils: UtilsService,
    private router: Router,
    private userProfileService: UserProfileService,
    private cloudrunService: CloudrunService,
    private snackbar: MatSnackBar,
    private paidStatusPipe: PaidStatusPipe,
    private shippedStatusPipe: ShippedStatusPipe,
    private translate: TranslateService,
    private agePipe: AgePipe
  ) {}

  ngOnInit(): void {
    this.getToken();
    this.checkEventId();
    this.getAccessRight();
    this.getActivityDetail();
    this.handlePageResize();
  }

  /**
   * 從localstorage取得token，若無token則導向登入頁
   */
  getToken() {
    const token = this.utils.getToken();
    if (token) {
      this.token = token;
      this.searchInfo.token = token;
    } else {
      this.router.navigateByUrl('/official-activity/login');
    }
    
  }

  /**
   * 確認eventId是否符合數字格式
   * @author kidin-1101015
   */
  checkEventId() {
    const eventId = this.activatedRoute.snapshot.paramMap.get('eventId');
    if (formTest.number.test(eventId)) {
      this.eventId = +eventId;
      this.searchInfo.targetEventId = +eventId;
    } else {
      this.router.navigateByUrl(pageNotFoundPath);
    }

  }

  /**
   * 如為登入狀態，則取得個人權限
   * @author kidin-1101015
   */
  getAccessRight() {
    this.userProfileService.getRxUserProfile().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      if (res) {
        const { systemAccessRight } = res;
        const notAdmin = systemAccessRight[0] !== 28;
        if (notAdmin) this.router.navigateByUrl(officialHomePage);

      } else {
        this.router.navigateByUrl(officialHomePage);
      }

    });

  }

  /**
   * 取得活動詳細資訊與排行榜
   * @author kidin-1101014
   */
  getActivityDetail() {
    this.eventId = +this.activatedRoute.snapshot.paramMap.get('eventId');
    const { eventId, token } = this;
    combineLatest([
      this.officialActivityService.getEventDetail({eventId}),
      this.officialActivityService.getRxAllMapInfo()
    ]).pipe(
      switchMap(resultArray => {
        const [detail, mapInfo] = resultArray;
        const { eventInfo, eventDetail: { group } } = detail;
        this.eventInfo = eventInfo;
        this.groupList = this.getGroupList(group);
        this.allMapInfo = mapInfo as Array<any>;
        if (this.utils.checkRes(detail)) {
          const {
            eventInfo: {
              cloudrunMapId: mapId,
              raceDate: {
                startDate: raceStartDate,
                endDate: raceEndDate
              }
            },
            currentTimestamp
          } = detail;
          this.saveServerTime(currentTimestamp);
          const body = {
            token,
            eventId,
            mapId: +mapId,
            rankType: RankType.designatedEvent,
            raceStartDate,
            raceEndDate,
            page: 0,
            pageCounts: 10000
          };

          return this.cloudrunService.getLeaderboardStatistics(body).pipe(
            map(leaderboardResult => leaderboardResult)
          )
        } else {
          return this.router.navigateByUrl(pageNotFoundPath);
        }

      })
    ).subscribe(result => {
      if (this.utils.checkRes(result)) {
        const { info: { rankList } } = result as any;
        this.leaderboard = rankList;
        this.getParticipantList();
      }

    });

  }

  /**
   * 取得分組列表
   * @param group {Array<any>}-官方活動分組
   * @author kidin-1101123
   */
  getGroupList(group: any) {
    const groupLength = group.length;
    const groupColor = this.officialActivityService.assignGroupColor(groupLength);
    const groupList = group.map((_group, index) => {
      const color = groupColor[index];
      Object.assign(_group, { color });
      return _group;
    });

    return groupList;
  }

  /**
   * 取得參賽者列表
   * @author kidin-1101117
   */
  getParticipantList() {
    const { progress } = this.uiFlag;
    if (progress === 100) {
      this.uiFlag.progress = 30;
      this.officialActivityService.getParticipantList(this.searchInfo).pipe(
        map(res => {
          if (this.utils.checkRes(res)) {
            const { participantList } = res;
            return this.reEditList(participantList);
          } else {
            return [];
          }

        }),
        map(reEditList => this.bindRecord(reEditList))
      ).subscribe(bindResult => {
        const [normalList, leaveList] = this.filterApplyStatus(bindResult);
        this.participantList = normalList;
        this.backupLeaveList = leaveList;
        this.leaveList = leaveList;
        of(this.participantList).pipe(
          map(list => this.sortList(list)),
          map(sortList => this.assignRank(sortList))
        ).subscribe(finalList => {
          this.reArrangeList = finalList;
        });

        this.uiFlag.progress = 100;
      });

    }

  }

  /**
   * 根據報名狀態進行篩選
   * @param list {Array<any>}
   * @author kidin-1101126
   */
  filterApplyStatus(list: Array<any>) {
    const normalList = [];
    const leaveList = [];
    list.forEach(_list => {
      if (_list.applyStatus === ApplyStatus.applied) {
        normalList.push(_list);
      } else {
        leaveList.push(_list);
      }

    });

    return [normalList, leaveList];
  }

  /**
   * 根據出貨日期變更結案狀態
   * @param list {Array<any>}-參賽者列表
   * @author kidin-1101118
   */
  reEditList(list: Array<any>) {
    // 出貨7天過後即可視為結案
    const closeCaseDate = moment().add(7, 'day').unix();
    return list.map(_list => {
      const {
        productShipped,
        awardShipped,
        productShippingDate,
        awardShippingDate,
        haveProduct
      } = _list;
      const productCaseClose = this.checkCanClose(productShipped, productShippingDate, closeCaseDate);
      const awardCaseClose = this.checkCanClose(awardShipped, awardShippingDate, closeCaseDate);
      if (haveProduct === HaveProduct.no) {
        _list.productShipped = ProductShipped.needNotShip;
      } else if (productCaseClose) {
        _list.productShipped = ProductShipped.closeCase;
      }

      if (awardCaseClose) {
        _list.awardShipped = ProductShipped.closeCase;
      }

      return _list;
    });

  }

  /**
   * 確認是否可結案
   * @author kidin-1101118
   */
  checkCanClose(status: ProductShipped, shipDate: number, closeDate: number) {
    if (shipDate) {
      const shipped = status === ProductShipped.shipped;
      const caseClose = shipDate > closeDate;
      return shipped && caseClose;
    } else {
      return false;
    }

  }

  /**
   * 合併api 2016與api 6006
   * @param list {Ayyay<any>}
   * @author kidin-1101119
   */
  bindRecord(list: Array<any>) {
    const { leaderboard } = this;
    leaderboard.forEach(_leaderboard => {
      const { userId, result: record } = _leaderboard;
      list = this.matchInfo(list, userId, record);
    });

    return list;
  }

  /**
   * 在參賽者列表中找到指定參賽者資訊，並寫入成績
   * @param list {Array<any>}-參賽者列表
   * @param targetUserId {number}-使用者id
   * @param record {number}-成績
   * @author kidin-110111
   */
  matchInfo(list: Array<any>, targetUserId: number, record: number) {
    for (let i = 0; i < list.length; i++) {
      const { userId } = list[i];
      if (targetUserId === userId) {
        Object.assign(list[i], { record });
        return list;
      }

    }

  }

  /**
   * 根據排序類別進行排序
   * @param list {Array<any>}-參賽者列表
   * @author kidin-1101118
   */
  sortList(list: Array<any>, assignSort: SortSet = null) {
    const sortRule = assignSort ? assignSort : this.sortSet;
    const { type, order } = sortRule;

    return list.sort((a, b) => {
      let sortKey: string;
      switch (type) {
        case 'rank':
          sortKey = 'record';
          break;
        case 'group':
          sortKey = 'groupId';
          break;
        case 'paidStatus':
          sortKey = 'paidStatus';
          break;
        case 'orderStatus':
          sortKey = 'productShipped';
          break;
        case 'awardStatus':
          sortKey = 'awardShipped';
          break;
        case 'paidDate':
          sortKey = 'paidDate';
          break;
        case 'shippedDate':
          sortKey = 'productShippingDate';
          break;
      }

      const compareA = a[sortKey];
      const compareB = b[sortKey];
      // 以成績排序時無成績者必排最後
      if (!compareA) {
        return 1;
      } else if (!compareB) {
        return -1;
      }

      return order === 'asc' ? compareA - compareB : compareB - compareA;
    });
 
  }

  /**
   * 根據成績進行排名
   * @param sortList {Array<any>}-根據成績排序過的參賽者列表
   * @author kidin-1101129
   */
  assignRank(sortList: Array<any>) {
    return sortList.map((_list, index) => {
      delete _list.rank;  // 初始化名次
      const { record } = _list;
      if (record) {
        let rank: number;
        if (index !== 0) {
          const { rank: frontRank, record: frontRecord } = sortList[index - 1];
          rank = record > frontRecord ? frontRank + 1 : frontRank;
        } else {
          rank = 1;
        }

        Object.assign(_list, { rank });
      }
      
      return _list;
    });

  }

  /**
   * 變更排序順序
   * @param e {MouseEvent}
   * @author kidin-1101126
   */
  changeSortOrder(e: MouseEvent) {
    e.stopPropagation();
    this.uiFlag.expandDetail = null;
    const { value: newOrder } = (e as any).target;
    const { order } = this.sortSet;
    if (newOrder !== order) {
      this.sortSet.order = newOrder;
      this.reArrangeList = this.sortList(this.reArrangeList);
    }

  }

  /**
   * 變更排序依據
   * @param e {MouseEvent}
   * @author kidin-1101126
   */
  changeSortType(e: MouseEvent) {
    e.stopPropagation();
    this.uiFlag.expandDetail = null;
    const { value: newType } = (e as any).target;
    const { type } = this.sortSet;
    if (newType !== type) {
      this.sortSet.type = newType;
      this.reArrangeList = this.sortList(this.reArrangeList);
    }

  }

  /**
   * 處理視窗大小改變事件
   * @author kidin1101019
   */
  handlePageResize() {
    const resizeEvent = fromEvent(window, 'resize');
    this.resizeSubscription = resizeEvent.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      this.uiFlag.screenSize = window.innerWidth;
    });

  }

  /**
   * 搜尋指定參賽者(含回收區)
   * @param e {MouseEvent}
   * @author kidin-1101123
   */
  searchContestant(e: MouseEvent) {
    this.uiFlag.expandDetail = null;
    const keyword = (e as any).target.value;
    const isPhoneWord = formTest.number.test(keyword);
    const isEmailWord = formTest.email.test(keyword);
    if (isPhoneWord) {
      this.reArrangeList = this.participantList.filter(_list => `${_list.mobileNumber}`.includes(keyword));
      this.leaveList = this.backupLeaveList.filter(_list => `${_list.mobileNumber}`.includes(keyword));
    } else if (isEmailWord) {
      this.reArrangeList = this.participantList.filter(_list => _list.email.includes(keyword));
      this.leaveList = this.backupLeaveList.filter(_list => _list.email.includes(keyword));
    } else {
      const matchKeyword = (list) => {
        const { email, nickname, truthName } = list;
        const emailMatch = email ? email.includes(keyword) : false;
        const nicknameMatch = nickname.includes(keyword);
        const truthNameMatch = truthName.includes(keyword);
        return emailMatch || nicknameMatch || truthNameMatch;
      }

      this.reArrangeList = this.participantList.filter(_list => matchKeyword(_list));
      this.leaveList = this.backupLeaveList.filter(_list => matchKeyword(_list));
    }

  }

  /**
   * 顯示篩選條件選擇器
   * @param e {MouseEvent}
   * @author kidin-1101123
   */
  showFilterSelector(e: MouseEvent) {
    e.stopPropagation();
    const { showFilterSelector } = this.uiFlag;
    if (showFilterSelector) {
      this.unsubscribeClickScrollEvent();
    } else {
      this.uiFlag.showFilterSelector = true;
      this.subscribeClickScrollEvent();
    }

  }

  /**
   * 訂閱點擊與滾動事件
   * @author kidin-1101108
   */
  subscribeClickScrollEvent() {
    const targetElement = document.querySelector('#main__page');
    const clickEvent = fromEvent(document, 'click');
    const scrollEvent = fromEvent(targetElement, 'scroll');
    this.clickScrollEvent = merge(clickEvent, scrollEvent).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.unsubscribeClickScrollEvent();
    });

  }
  
  /**
   * 取消訂閱全域點擊與滾動事件
   * @author kidin-1101108
   */
  unsubscribeClickScrollEvent() {
    this.uiFlag.showFilterSelector = false;
    this.uiFlag.showGroupList = null;
    this.uiFlag.showPaidStatusSelector = null;
    this.uiFlag.showOrderStatusSelector = null;
    this.uiFlag.showAwardStatusSelector = null;
    this.uiFlag.showSortMenu = false;
    if (this.clickScrollEvent) this.clickScrollEvent.unsubscribe();
  }

  /**
   * 顯示所有參賽者
   * @author kidin-1101124
   */
  showAllList() {
    this.listFilter = {
      type: null,
      value: null,
      groupName: null
    };

    this.filterList();
  }

  /**
   * 篩選指定群組參賽者
   * @param groupId {number}-分組流水id
   * @param groupName {number}-分組名稱
   * @author kidin-1101123
   */
  filterGroup(groupId: number, groupName: string) {
    this.listFilter = {
      type: 'group',
      value: groupId,
      groupName
    };

    this.filterList();
  }

  /**
   * 篩選繳費狀態
   * @param status {PaidStatusEnum}-繳費狀態
   * @author kidin-1101123
   */
  filterPaidStatus(status: PaidStatusEnum) {
    this.listFilter.type = 'paidStatus';
    this.listFilter.value = status;
    this.filterList();
  }

  /**
   * 篩選訂單出貨狀態
   * @param status {ProductShipped}-訂單出貨狀態
   * @author kidin-1101123
   */
  filterOrderStatus(status: ProductShipped) {
    this.listFilter.type = 'orderStatus';
    this.listFilter.value = status;
    this.filterList();
  }

  /**
   * 篩選獎品出貨狀態
   * @param status {ProductShipped}-獎品出貨狀態
   */
  filterAwardStatus(status: ProductShipped) {
    this.listFilter.type = 'awardStatus';
    this.listFilter.value = status;
    this.filterList();
  }

  /**
   * 根據條件將清單做篩選
   * @author kidin-1101124
   */
  filterList() {
    this.uiFlag.expandDetail = null;
    const { type, value } = this.listFilter;
    let item: string;
    switch (type) {
      case 'group':
        item = 'groupId';
        break;
      case 'paidStatus':
        item = 'paidStatus'
        break;
      case 'orderStatus':
        item = 'productShipped'
        break;
      case 'awardStatus':
        item = 'awardShipped'
        break;
      default:
        item = null;
        break;
    }

    of(this.participantList).pipe(
      map(list => {
        if (item) {
          return list.filter(_list => _list[item] === value);
        } else {
          return list;
        }
        
      }),
      map(filterList => this.sortList(filterList, defaultSortSet)),
      map(sortList => this.assignRank(sortList)),
      map(rankList => this.sortList(rankList))
    ).subscribe(finalList => {
      this.reArrangeList = finalList;
    });

  }

  /**
   * 顯示或隱藏清單詳細內容
   * @param index {number}-清單顯示順位
   * @author kidin-1101124
   */
  showListDetail(listType: ListType, index: number) {
    const { expandDetail } = this.uiFlag;
    const newIndex = `${listType}${index}`;
    if (expandDetail !== newIndex) {
      this.uiFlag.expandDetail = newIndex;
    } else {
      const { focusInput } = this.uiFlag;
      if (!focusInput) this.uiFlag.expandDetail = null;
    }

  }

  /**
   * 顯示或隱藏變更列表
   * @param e {MouseEvent}
   * @param listType {ListType}-參賽者清單類別
   * @param type {string}-欲開啟選單之欄位類別
   * @param index {number}-清單顯示順位
   * @author kidin-1101124
   */
  showSelector(
    e: MouseEvent,
    listType: ListType,
    type: string,
    index: number
  ) {
    e.stopPropagation();
    if (listType === 'normal') {
      const oldIndex = this.uiFlag[type];
      if (oldIndex !== index) {
        this.uiFlag[type] = index;
        this.subscribeClickScrollEvent();
      } else {
        this.unsubscribeClickScrollEvent();
      }

    }

  }

  /**
   * 開啟參賽者詳細資訊編輯模式
   * @param e {MouseEvent}
   * @author kidin-1101125
   */
  openEditableMode(e: MouseEvent) {
    e.stopPropagation();
    this.uiFlag.detailEditable = !this.uiFlag.detailEditable;
  }

  /**
   * 變更指定參賽者分組組別
   * @param e {MouseEvent}
   * @param targetUserId {number}-使用者流水id
   * @param group {number}-指定的群組資訊
   * @param index {number}-顯示順位
   * @author kidin-1101125
   */
  changeGroup(
    e: MouseEvent,
    group: any,
    index: number
  ) {
    e.stopPropagation();
    const { id: groupId, name: groupName } = group;
    const { 
      groupId: oldGroupId,
      groupName: oldGroupName,
      userId: targetUserId
    } = this.reArrangeList[index];
    if (oldGroupId !== groupId) {
      this.reArrangeList[index].groupId = groupId;
      this.reArrangeList[index].groupName = groupName;
      const update = [{
        targetUserId,
        groupId
      }];

      this.updateUserEventProfile(update).subscribe(success => {
        if (success) {
          const replace = { groupId, groupName };
          this.updateOriginProfile(targetUserId, replace);
        } else {
          this.reArrangeList[index].groupId = oldGroupId;
          this.reArrangeList[index].groupName = oldGroupName;
        }

      });

    }

    this.unsubscribeClickScrollEvent();
  }

  /**
   * 移除參賽者
   * @param e {MouseEvent}
   * @param index {number}-顯示順位
   * @author kidin-1101126
   */
  removeContestant(e: MouseEvent, index: number) {
    e.stopPropagation();
    const { userId: targetUserId } = this.reArrangeList[index];
    const update = [{
      targetUserId,
      applyStatus: ApplyStatus.cancel
    }];

    this.updateUserEventProfile(update).subscribe(success => {
      if (success) {
        const leaveIndex = this.participantList.findIndex(_list => _list.userId == targetUserId);
        const [leaveContestant] = this.participantList.splice(leaveIndex, 1);
        this.backupLeaveList.push(leaveContestant);
        of(this.participantList).pipe(
          map(list => this.sortList(list, defaultSortSet)),
          map(sortList => this.assignRank(sortList)),
          map(rankList => this.sortList(rankList)),
        ).subscribe(result => {
          this.reArrangeList = result;
        });

        this.leaveList = this.utils.deepCopy(this.backupLeaveList);
      }

    });

  }

  /**
   * 將移除的參賽者加回參賽名單中
   * @param delIndex {number}-回收區顯示順位
   * @author kidin-1101126
   */
  addContestant(delIndex: number) {
    const { userId: targetUserId } = this.backupLeaveList[delIndex];
    const update = [{
      targetUserId,
      applyStatus: ApplyStatus.applied
    }];

    this.updateUserEventProfile(update).subscribe(success => {
      if (success) {
        const [addContestant] = this.backupLeaveList.splice(delIndex, 1);
        this.participantList.push(addContestant);
        of(this.participantList).pipe(
          map(list => this.sortList(list, defaultSortSet)),
          map(sortList => this.assignRank(sortList))
        ).subscribe(result => {
          this.reArrangeList = result;
        });

        this.leaveList = this.utils.deepCopy(this.backupLeaveList);
      }

    });

  }

  /**
   * 變更指定參賽者繳費狀態
   * @param e {MouseEvent}
   * @param targetUserId {number}-使用者流水id
   * @param paidStatus {PaidStatusEnum}-繳費狀態
   * @author kidin-1101125
   */
  changePaidStatus(
    e: MouseEvent,
    paidStatus: PaidStatusEnum,
    index: number
  ) {
    e.stopPropagation();
    const {
      paidStatus: oldPaidStatus,
      userId: targetUserId
    } = this.reArrangeList[index];
    if (paidStatus !== oldPaidStatus) {
      this.reArrangeList[index].paidStatus = paidStatus;
      const update = [{
        targetUserId,
        paidStatus
      }];

      this.updateUserEventProfile(update).subscribe(success => {
        if (success) {
          const replace = { paidStatus };
          this.updateOriginProfile(targetUserId, replace);
        } else {
          this.reArrangeList[index].paidStatus = oldPaidStatus;
        }

      });

    }

    this.unsubscribeClickScrollEvent();
  }

  /**
   * 變更指定參賽者訂單或獎品出貨狀態
   * @param e {MouseEvent}
   * @param targetUserId {number}-使用者流水id
   * @param productShipped {ProductShipped}-繳費狀態
   * @param type {ShippedType}-出貨類別（訂單/獎品）
   * @author kidin-1101125
   */
  changeShippedStatus(
    e: MouseEvent,
    shipped: ProductShipped,
    index: number,
    type: ShippedType
  ) {
    e.stopPropagation();
    const { userId: targetUserId} = this.reArrangeList[index];
    const oldStatus = this.reArrangeList[index][type];
    if (shipped !== oldStatus) {
      this.reArrangeList[index][type] = shipped;
      const shippingDate = this.getShippingDate(type, shipped);
      const update = [{
        targetUserId,
        [type]: shipped,
        ...shippingDate
      }];

      this.updateUserEventProfile(update).subscribe(success => {
        if (success) {
          const replace = { [type]: shipped, ...shippingDate };
          this.updateOriginProfile(targetUserId, replace);
        } else {
          this.reArrangeList[index][type] = oldStatus;
        }

      });

    }

    this.unsubscribeClickScrollEvent();
  }

  /**
   * 產生出貨時間
   * @param type {ShippedType}-出貨類別
   * @param shipped {ProductShipped}-出貨狀態
   * @author kidin-1101216
   */
  getShippingDate(type: ShippedType, shipped: ProductShipped) {
    let ServerCurrentTimeStamp: number | string;
    switch (shipped) {
      case ProductShipped.unShip:
        ServerCurrentTimeStamp = 0;
        break;
      case ProductShipped.shipped:
        ServerCurrentTimeStamp = this.utils.getCurrentTimestamp() + this.serverTimeDiff;
        break;
      case ProductShipped.unShip:
        return {};
    }

    switch (type) {
      case 'productShipped':
        return { productShippingDate: ServerCurrentTimeStamp };
      case 'awardShipped':
        return { awardShippingDate: ServerCurrentTimeStamp };
    }

  }

  /**
   * 編輯參賽者私人資訊
   * @param e {MouseEvent}
   * @param type {ProfileEditType}-編輯類別
   * @param index {number}-清單顯示順序
   * @author kidin-1101125
   */
  handleEditDetail(e: MouseEvent, type: ProfileEditType, index: number) {
    this.uiFlag.focusInput = false;
    const { value } = (e as any).target;
    const newValue = value.length === 0 && type === 'mobileNumber' ? +value : value;
    const assignUserInfo = this.reArrangeList[index];
    const { userId: targetUserId } = assignUserInfo;
    const emergencyInfo = ['name', 'mobileNumber', 'relationship'];
    const isEmergencyInfo = emergencyInfo.includes(type);
    const oldValue = isEmergencyInfo ?
      assignUserInfo['emergencyContact'][type] : assignUserInfo[type];
    if (newValue !== oldValue) {
      let update: Array<any>;
      if (isEmergencyInfo) {
        this.reArrangeList[index]['emergencyContact'][type] = newValue;
        update = [{ targetUserId, emergencyContact: { [type]: newValue } }];
      } else {
        this.reArrangeList[index][type] = newValue;
        update = [{ targetUserId, [type]: newValue }];
      }

      this.updateUserEventProfile(update).subscribe(success => {
        if (success) {
          const { emergencyContact } = this.reArrangeList[index];
          const replace = { emergencyContact };
          this.updateOriginProfile(targetUserId, replace);
        } else {

          if (isEmergencyInfo) {
            this.reArrangeList[index]['emergencyContact'][type] = oldValue;
          } else {
            this.reArrangeList[index][type] = oldValue;
          }
          
        }

      });

    }

  }

  /**
   * 更新指定參賽者的活動資訊
   * @param update {Array<any>}-欲更新的項目
   * @author kidin-1101125
   */
  updateUserEventProfile(update: Array<any>) {
    const { token, eventId: targetEventId } = this;
    const body = {
      token,
      targetEventId,
      update
    };

    return this.officialActivityService.editParticipantList(body).pipe(
      map(res => {
        const success = this.utils.checkRes(res);
        const msg = success ? '更新成功' : '更新失敗';
        this.snackbar.open(msg, 'OK', {duration: 2000});
        return success;
      })
    );

  }

  /**
   * 將藉由api 6006取得的資訊根據編輯內容進行更新
   * @param targetUserId {any}-使用者流水id
   * @param replace {any}-欲更新的資料
   * @author kidin-1101125
   */
  updateOriginProfile(targetUserId: number, replace: any) {
    const { participantList } = this;
    for (let i = 0; i < participantList.length; i++) {
      const { userId } = participantList[i];
      if (targetUserId === userId) {
        
        for (let _key in replace) {
          const value = replace[_key];
          if (value !== undefined) this.participantList[i][_key] = replace[_key];
        }

        break;
      }

    }

  }

  /**
   * 顯示排序依據之菜單與否
   * @param e {MouseEvent}
   * @author kidin-1101126
   */
  showSortMenu(e: MouseEvent) {
    e.stopPropagation();
    const { showSortMenu } = this.uiFlag;
    if (showSortMenu) {
      this.unsubscribeClickScrollEvent();
    } else {
      this.uiFlag.showSortMenu = true;
      this.subscribeClickScrollEvent();
    }

  }

  /**
   * 將參賽者名單製成CSV檔並提供下載
   * @author kidin-1101129
   */
   downloadCSV() {
    const { eventName } = this.eventInfo;
    const fileName = `${eventName}_參賽者名單.csv`;
    const data = this.switchCSVFile();
    const blob = new Blob(['\ufeff' + data], {  // 加上bom（\ufeff）讓excel辨識編碼
      type: 'text/csv;charset=utf8'
    });
    const href = URL.createObjectURL(blob);  // 建立csv檔url
    const link = document.createElement('a');  // 建立連結供csv下載使用

    document.body.appendChild(link);
    link.href = href;
    link.download = fileName;
    link.click();
  }
  
  /**
   * 將所需資料轉換為csv格式
   * @author kidin-1101129
   */
  switchCSVFile() {
    let csvData = '';
    const title = [
      '報名日期',
      'User id',
      '暱稱',
      '分組',
      '報名組合',
      '報名費用',
      '繳費狀態',
      '繳費時間',
      '英達訂單編號',
      '綠界訂單編號',
      '訂單狀態',
      '出貨日期',
      '名次',
      '成績',
      '獎品狀態',
      '獎品出貨日期',
      '真實姓名',
      '年齡',
      '性別',
      '國碼',
      '聯絡電話',
      'email',
      '國籍',
      '身份/居留證號',
      '地址',
      '備註',
      '緊急聯絡人姓名',
      '緊急聯絡人電話',
      '緊急聯絡人關係'
    ];

    title.forEach(_title => {
      csvData += `${_title},`;
    });

    csvData += '\n';
    const { reArrangeList, leaveList } = this;
    const dateFormat = 'YYYY-MM-DD';
    const applyDateFormat = `${dateFormat} HH:mm`;
    const createRowInfo = (list) => {
      const {
        appliedDate,
        userId,
        nickname,
        groupName,
        feeTitle,
        fee,
        paidStatus,
        paidDate,
        officialPaidId,
        thirdPartyPaidId,
        productShipped,
        productShippingDate,
        rank,
        record,
        awardShipped,
        awardShippingDate,
        truthName,
        birthday,
        gender,
        countryCode,
        mobileNumber,
        email,
        taiwaness,
        idCardNumber,
        address,
        remark,
        emergencyContact: {
          name: emergencyName,
          mobileNumber: emergencyPhone,
          relationship
        }
      } = list;

      const ageBase = {
        birth: birthday,
        birthFormat: 'YYYYMMDD',
        baseDate: appliedDate ? appliedDate * 1000 : null,
        baseFormat: null
      };

      return `${
        appliedDate ? moment(appliedDate).format(applyDateFormat) : ''
        },${userId
        },${nickname
        },${groupName
        },${feeTitle
        },${fee
        },${this.paidStatusPipe.transform(paidStatus)
        },${paidDate ? moment(paidDate).format(dateFormat) : ''
        },${officialPaidId ? officialPaidId : ''
        },${thirdPartyPaidId ? thirdPartyPaidId : ''
        },${this.shippedStatusPipe.transform(productShipped)
        },${productShippingDate ? moment(productShippingDate).format(dateFormat) : ''
        },${rank ? rank : ''
        },${record ? record : ''
        },${this.shippedStatusPipe.transform(awardShipped)
        },${awardShippingDate ? moment(awardShippingDate).format(dateFormat) : ''
        },${truthName
        },${this.agePipe.transform(ageBase)
        },${gender === Sex.male ? '男' : '女'
        },+${countryCode
        },${mobileNumber
        },${email ? email : ''
        },${taiwaness === Nationality.taiwaness ? '本國' : '外國'
        },${idCardNumber
        },${address
        },${remark ? remark : ''
        },${emergencyName ? emergencyName : ''
        },${emergencyPhone ? emergencyPhone : ''
        },${relationship ? relationship : ''
      },\n`;
    };

    reArrangeList.forEach(_list => {
      csvData += createRowInfo(_list);
    });

    /*************************
     * 暫不將回收區資訊列入csv
     * 方便使用者使用excel篩選功能
    
    const blank = ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n';
    csvData += `\n\n${blank}`;
    leaveList.forEach(_list => {
      csvData += createRowInfo(_list);
    });

    **************************/

    return csvData;
  }

  /**
   * 開啟或關閉移除參賽者模式
   * @author kidin-1101126
   */
  handleDeleteMode() {
    this.uiFlag.deleteMode = !this.uiFlag.deleteMode;
  }

  /**
   * 更新使用者狀態
   * @param e {MouseEvent}
   * @param index {number}-顯示順位
   * @author kidin-1101126
   */
  refreshUserInfo(e: MouseEvent, index: number) {
    e.stopPropagation();
    const { feeId, officialPaidId, userId: targetUserId } = this.reArrangeList[index];
    if (officialPaidId) {
      const { token, eventId } = this;
      const body = {
        token,
        eventId,
        feeId,
        officialPaidId
      };

      this.officialActivityService.updateProductOrder(body).pipe(
        switchMap(updateResult => {
          if (this.utils.checkRes(updateResult)) {
            return this.officialActivityService.getParticipantList(this.searchInfo).pipe(
              map(participantList => participantList)
            )
          } else {
            return updateResult;
          }
        })
      ).subscribe(res => {
        if (this.utils.checkRes(res)) {
          const { participantList } = res as any;
          const newUserInfo = participantList.filter(_list => _list.userId === targetUserId);
          const { paidStatus, thirdPartyPaidId, paidDate } = newUserInfo[0];
          this.reArrangeList[index].paidStatus = paidStatus;
          this.reArrangeList[index].thirdPartyPaidId = thirdPartyPaidId;
          this.reArrangeList[index].paidDate = paidDate;

          const replace = { paidStatus, thirdPartyPaidId, paidDate };
          this.updateOriginProfile(targetUserId, replace);
        }

      });

    }

  }

  /**
   * 儲存server時間與client時間之差值，方便校正並更新出貨時間
   * @param serverTime {number}-server currentTimestamp
   * @author kidin-1101216
   */
  saveServerTime(serverTime: number) {
    const currentTimeStamp = this.utils.getCurrentTimestamp();
    this.serverTimeDiff = currentTimeStamp - serverTime;
  }

  /**
   * 聚焦輸入框
   * @author kidin-1101216
   */
  focusInput() {
    this.uiFlag.focusInput = true;
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
