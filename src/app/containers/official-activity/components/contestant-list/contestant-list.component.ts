import { Component, OnInit, OnDestroy } from '@angular/core';
import { OfficialActivityService } from '../../services/official-activity.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilsService } from '../../../../shared/services/utils.service';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { formTest } from '../../../../shared/models/form-test';
import { Subject, Subscription, fromEvent, combineLatest, merge } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { pageNotFoundPath } from '../../models/official-activity-const';
import { CloudrunService } from '../../../../shared/services/cloudrun.service';
import { RankType } from '../../../../shared/models/cloudrun-leaderboard';
import { ProductShipped, HaveProduct, ApplyStatus, PaidStatusEnum, Nationality } from '../../models/activity-content';
import moment from 'moment';
import { MatSnackBar } from '@angular/material/snack-bar';


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
    showSortMenu: false
  };

  sortSet = {
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
      counts: 10
    }
  };

  /**
   * 清單篩選條件
   */
  listFilter = {
    type: <SortType>null,
    status: null,
    groupId: null,
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

  token: string;
  eventId: number;
  eventInfo: any;
  leaderboard: any;
  participantList: Array<any>;
  allMapInfo: Array<any>;
  reArrangeList = [];
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
    private snackbar: MatSnackBar
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
    const { token } = this;
    this.userProfileService.getRxUserProfile().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      const { systemAccessRight } = res;
      const notAdmin = systemAccessRight[0] !== 28;
      if (notAdmin) this.router.navigateByUrl(pageNotFoundPath);
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
            cloudrunMapId: mapId,
            raceDate: {
              startDate: raceStartDate,
              endDate: raceEndDate
            }
          } = detail.eventInfo;
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
console.log('event detail', result);
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
    const groupColor = this.assignGroupColor(groupLength);
    const groupList = group.map((_group, index) => {
      const color = groupColor[index];
      Object.assign(_group, { color });
      return _group;
    });
console.log('gorupList', groupList);
    return groupList;
  }

  /**
   * 取得參賽者列表
   * @author kidin-1101117
   */
  getParticipantList() {
    this.officialActivityService.getParticipantList(this.searchInfo).pipe(
      map(res => {
console.log('participantList', res);
        if (this.utils.checkRes(res)) {
          const { participantList } = res;
          return this.reEditList(participantList);
        } else {
          return [];
        }

      }),
      map(reEditList => this.bindRecord(reEditList))
    ).subscribe(bindResult => {
console.log('bindResult', bindResult);
      const [normalList, leaveList] = this.filterApplyStatus(bindResult);
      this.participantList = normalList;
      this.leaveList = leaveList;
      this.reArrangeList = this.sortList();
console.log('reArrangeList', this.reArrangeList);
    });

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
    const closeCaseDate = moment().subtract(7, 'day').unix();
    return list.map(_list => {
      const {
        productShipped,
        awardShipped,
        productShippingDate,
        awardShippingDate,
        haveProduct,
        applyStatus
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
   * @author kidin-1101118
   */
  sortList() {
    const { type, order } = this.sortSet;
    return this.participantList.sort((a, b) => {
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
   * 變更排序順序
   * @param e {MouseEvent}
   * @author kidin-1101126
   */
  changeSortOrder(e: MouseEvent) {
    e.stopPropagation();
    const { value: newOrder } = (e as any).target;
    const { order } = this.sortSet;
    if (newOrder !== order) {
      this.sortSet.order = newOrder;
      this.sortList();
    }

  }

  /**
   * 變更排序依據
   * @param e {MouseEvent}
   * @author kidin-1101126
   */
  changeSortType(e: MouseEvent) {
    e.stopPropagation();
    const { value: newType } = (e as any).target;
    const { type } = this.sortSet;
    if (newType !== type) {
      this.sortSet.type = newType;
      this.sortList();
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
   * 搜尋指定參賽者
   * @param e {MouseEvent}
   * @author kidin-1101123
   */
  searchContestant(e: MouseEvent) {
    const keyword = (e as any).target.value;
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
   * 根據群組數目分配分組代表色
   * @param length {number}-群組數目
   * @author kidin-1101123
   */
  assignGroupColor(length: number) {
    const hueRange = 360;
    const colorAssign = [];
    for (let i = 1; i <= length; i++) {
      const hue = Math.round((i / length) * hueRange);
      colorAssign.push(`hsla(${hue}, 100%, 85%, 1)`);
    }

    return colorAssign;
  }

  /**
   * 顯示所有參賽者
   * @author kidin-1101124
   */
  showAllList() {
    this.listFilter = {
      type: null,
      status: null,
      groupId: null,
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
      status: null,
      groupId,
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
    this.listFilter.status = status;
    this.filterList();
  }

  /**
   * 篩選訂單出貨狀態
   * @param status {ProductShipped}-訂單出貨狀態
   * @author kidin-1101123
   */
  filterOrderStatus(status: ProductShipped) {
    this.listFilter.type = 'orderStatus';
    this.listFilter.status = status;
    this.filterList();
  }

  /**
   * 篩選獎品出貨狀態
   * @param status {ProductShipped}-獎品出貨狀態
   */
  filterAwardStatus(status: ProductShipped) {
    this.listFilter.type = 'awardStatus';
    this.listFilter.status = status;
    this.filterList();
  }

  /**
   * 根據條件將清單做篩選
   * @author kidin-1101124
   */
  filterList() {
    const { type, status, groupId } = this.listFilter;
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
      this.uiFlag.expandDetail = null;
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
          const replaceDate = { groupId, groupName };
          this.updateOriginProfile(targetUserId, replaceDate);
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
   * @param index {number}-顯示順位
   * @author kidin-1101126
   */
  removeContestant(index: number) {
    const { userId: targetUserId } = this.reArrangeList[index];
    const update = [{
      targetUserId,
      applyStatus: ApplyStatus.cancel
    }];

    this.updateUserEventProfile(update).subscribe(success => {
      if (success) {
        const leaveIndex = this.participantList.indexOf(_list => _list.userId === targetUserId);
        const [leaveContestant] = this.participantList.splice(leaveIndex, 1);
        this.leaveList.push(leaveContestant);
        this.reArrangeList = this.sortList();
      }

    });

  }

  /**
   * 將移除的參賽者加回參賽名單中
   * @param delIndex {number}-回收區顯示順位
   * @author kidin-1101126
   */
  addContestant(delIndex: number) {
    const { userId: targetUserId } = this.leaveList[delIndex];
    const update = [{
      targetUserId,
      applyStatus: ApplyStatus.applied
    }];

    this.updateUserEventProfile(update).subscribe(success => {
      if (success) {
        const [addContestant] = this.leaveList.splice(delIndex, 1);
        this.participantList.push(addContestant);
        this.reArrangeList = this.sortList();
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
          const replaceDate = { paidStatus };
          this.updateOriginProfile(targetUserId, replaceDate);
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
      const update = [{
        targetUserId,
        [type]: shipped
      }];

      this.updateUserEventProfile(update).subscribe(success => {
        if (success) {
          const replaceDate = { shipped };
          this.updateOriginProfile(targetUserId, replaceDate);
        } else {
          this.reArrangeList[index][type] = oldStatus;
        }

      });

    }

    this.unsubscribeClickScrollEvent();
  }

  /**
   * 編輯參賽者私人資訊
   * @param e {MouseEvent}
   * @param type {ProfileEditType}-編輯類別
   * @param index {number}-清單顯示順序
   * @author kidin-1101125
   */
  handleEditDetail(e: MouseEvent, type: ProfileEditType, index: number) {
    const { value } = (e as any).target;
    const assignUserInfo = this.reArrangeList[index];
    const { userId: targetUserId } = assignUserInfo;
    const emergencyInfo = ['name', 'mobileNumber', 'relationship'];
    const isEmergencyInfo = emergencyInfo.includes(type);
    const oldValue = isEmergencyInfo ?
      assignUserInfo['emergencyContact'][type] : assignUserInfo[type];

console.log('edit detail', value, oldValue);
    if (value !== oldValue) {
      let update: Array<any>;
      if (isEmergencyInfo) {
        this.reArrangeList[index]['emergencyContact'][type] = value;
        update = [{ targetUserId, emergencyContact: { [type]: value } }];
      } else {
        this.reArrangeList[index][type] = value;
        update = [{ targetUserId, [type]: value }];
      }

      this.updateUserEventProfile(update).subscribe(success => {
        if (success) {
          const emergencyContact = this.reArrangeList[index];
          const replaceDate = { emergencyContact };
          this.updateOriginProfile(targetUserId, replaceDate);
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
          this.participantList[i][_key] = replace[_key];
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
   * @author kidin-1101126
   */
  downloadCSV() {

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

        const replaceDate = { paidStatus, thirdPartyPaidId, paidDate };
        this.updateOriginProfile(targetUserId, replaceDate);
      }

    });

  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
