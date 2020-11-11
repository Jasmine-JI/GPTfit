import { Component, OnInit, OnDestroy, ElementRef, AfterViewChecked, HostListener, ViewChild } from '@angular/core';
import { fromEvent, Subscription, Subject } from 'rxjs';
import { tap, map, takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { MessageBoxComponent } from '../../../../shared/components/message-box/message-box.component';
import { ShareGroupInfoDialogComponent } from '../../../../shared/components/share-group-info-dialog/share-group-info-dialog.component';
import { GroupDetailInfo } from '../../models/group-detail';

import { UtilsService } from '../../../../shared/services/utils.service';
import { GroupService } from '../../services/group.service';
import { HashIdService } from '../../../../shared/services/hash-id.service';
import { UserProfileService } from '../../../../shared/services/user-profile.service';

const errMsg = `Error.<br />Please try again later.`;

interface GroupAccessRightList {
  accessRight: string;
  groupId: string;
  joinStatus: number;
}

@Component({
  selector: 'app-group-info-v2',
  templateUrl: './group-info.component.html',
  styleUrls: ['./group-info.component.scss']
})
export class GroupInfoComponent implements OnInit, AfterViewChecked, OnDestroy {

  @ViewChild('pageListBar') pageListBar: ElementRef;
  @ViewChild('seeMore') seeMore: ElementRef;

  private ngUnsubscribe = new Subject();

  pageResize: Subscription;
  clickEvent: Subscription;
  descSectionResize: Subscription;

  /**
   * 使用者在此群組的身份資料
   */
  user = {
    token: '',
    accessRight: [],
    joinStatus: 2,
    isGroupAdmin: false
  };

  /**
   * 操控頁面UI的各個flag
   */
  uiFlag = {
    windowInnerWidth: null,
    showMorePageOpt: false,
    divideIndex: 99,
    currentPage: 'group-introduction',
    currentTagIndex: 0,
    barPosition: 0,
    barWidth: 0
  };

  /**
   * 此群組相關資料
   */
  currentGroupInfo = {
    groupId: '',
    hashGroupId: '',
    groupLevel: 99,
    groupDetail: <GroupDetailInfo>{},
    allGroupInfo: {}
  };

  /**
   * 群組子頁面清單
   */
  childPageList: Array<string> = ['group-introduction'];

  /**
   * 儲存子頁面清單各選項按鈕寬度
   */
  perPageOptSize = {
    total: 0,
    perSize: []
  };

  constructor(
    private translate: TranslateService,
    private groupService: GroupService,
    private hashIdService: HashIdService,
    private route: ActivatedRoute,
    private router: Router,
    private utils: UtilsService,
    private userProfileService: UserProfileService,
    private dialog: MatDialog
  ) {}

  /**
   * 1. 確認視窗大小
   * 2. 訂閱視窗大小
   * @author kidin-20200710
   */
  ngOnInit(): void {
    
    this.getToken();
    this.detectUrlChange();

    this.router.events.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe((val: NavigationEnd) => {
      if (val instanceof NavigationEnd && val.url) {
        this.detectUrlChange();
      }
    });

    this.route.params.pipe(
      tap(params => console.log('params', params)),
      takeUntil(this.ngUnsubscribe)
    ).subscribe();

    this.handlePageResize();
  }

  ngAfterViewChecked() {}

  /**
   * 偵測瀏覽器是否改變大小
   * @author kidin-20200710
   */
  handlePageResize() {
    const page = fromEvent(window, 'resize');
    this.pageResize = page.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.checkScreenSize();
    });

  }

  /**
   * 偵測全域點擊事件，以收納"更多"選單
   * @author kidin-20201112
   */
  handleGlobalClick() {
    const clickEvent = fromEvent(document, 'click');
    this.clickEvent = clickEvent.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.uiFlag.showMorePageOpt = false;
    });

  }

  /**
   * 依瀏覽器大小將超出邊界的清單進行收納
   * @author kidin-20200714
   */
  checkScreenSize() {

    setTimeout(() => {
      const pageBar = this.pageListBar.nativeElement,
            pageBarWidth = pageBar.clientWidth;

      let reservedSpace = 0;
      this.uiFlag.windowInnerWidth = window.innerWidth;
      if (window.innerWidth >= 1000) {
        reservedSpace = 270; // sidebar展開所需的空間
      }

      if (pageBarWidth < this.perPageOptSize.total + reservedSpace) {
        const titleSizeList = this.perPageOptSize.perSize;
        let total = 0;
        for (let i = 0, sizeArrLen = titleSizeList.length; i < sizeArrLen; i++) {

          total += titleSizeList[i];
          if (total + reservedSpace + 130 >= pageBarWidth) { // 130為"更多"按鈕的空間
            this.uiFlag.divideIndex = i;
            break;
          }

        }

        this.handleGlobalClick();
      } else {
        this.uiFlag.divideIndex = null;
      }

      this.getBtnPosition(this.uiFlag.currentTagIndex);
    });
    
  }

  /**
   * 取得token
   * @author kidin-1090716
   */
  getToken() {
    this.user.token = this.utils.getToken() || '';
  }

  /**
   * 從url取得當前頁面的群組ID和階層
   * @author kidin-1090716
   */
  getCurrentGroupInfo() {
    this.currentGroupInfo.hashGroupId = this.route.snapshot.paramMap.get('groupId');
    this.currentGroupInfo.groupId = this.hashIdService.handleGroupIdDecode(
      this.currentGroupInfo.hashGroupId
    );

    this.currentGroupInfo.groupLevel = this.utils.displayGroupLevel(this.currentGroupInfo.groupId);
  }

  /**
   * 取得當前群組詳細資訊
   * @author kidin-1090716
   */
  getGroupDetail() {
    const body = {
      token: this.user.token,
      groupId: this.currentGroupInfo.groupId,
      findRoot: 1,
      avatarType: 3
    };

    this.groupService.fetchGroupListDetail(body).subscribe(res => {
      if (res.resultCode !== 200) {
        this.openAlert(errMsg);
        console.log(`${res.resultCode}: ${res.resultMessage}`);
      } else {
        this.groupService.saveGroupDetail(res.info);
        this.currentGroupInfo.groupDetail = res.info;
        console.log('groupDetail', this.currentGroupInfo.groupDetail);
      }

    });

  }

  /**
   * 儲存所有階層群組資訊
   * @author kidin-1090716
   */
  saveAllLevelGroupData() {
    this.groupService.saveAllLevelGroupData(
      this.user.token,
      this.currentGroupInfo.groupId,
      this.currentGroupInfo.groupLevel
    );

  }

  /**
   * 切換不同群組頁面及更新群組和使用者相關資訊
   * @author kidin-10812217
   */
  detectUrlChange() {
    this.getCurrentContentPage();
    this.getCurrentGroupInfo();
    this.getGroupDetail();
    this.saveAllLevelGroupData();
    this.getUserJoinInfo();
    this.checkUserAccessRight();
    this.initChildPageList();
    this.getPerPageOptSize();
  }

  /**
   * 根據url對應選單
   * @author kidin-1090813
   */
  getCurrentContentPage(): void {
    const arr = location.pathname.split('/');
    if (arr.length === 5) {
      this.uiFlag.currentPage = arr[arr.length - 1];
    } else {
      this.router.navigateByUrl(
        `/dashboard/group-info-v2/${this.hashIdService.handleGroupIdEncode(this.currentGroupInfo.groupId)}/group-introduction`
      );
    }
    
  }

  /**
   * 取得使用者加入資訊
   * @author kidin-1090811
   */
  getUserJoinInfo() {
    this.userProfileService.getRxUserProfile().pipe(
      tap(res => {
        console.log('userProfile', res);
      }),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => this.user.joinStatus = this.getJoinStatus(res.groupAccessRightList));

  }

  /**
   * 取得使用者該群組權限
   * @author kidin-1090811
   */
  checkUserAccessRight() {
    this.groupService.checkAccessRight(this.currentGroupInfo.groupId).subscribe(res => {
      this.user.accessRight = res;
      this.user.isGroupAdmin = this.user.accessRight.some(_accessRight => {
        if (this.currentGroupInfo.groupLevel === 60) {
          return _accessRight === 50 || _accessRight === 60;
        } else  {
          return _accessRight === this.currentGroupInfo.groupLevel;
        }

      });

    });

  }

  /**
   * 根據brand type、group level、user access right顯示可點選的頁面
   */
  initChildPageList() {
    const groupDetail = this.currentGroupInfo.groupDetail;
    if (groupDetail.brandType === 1 && this.currentGroupInfo.groupLevel === 60) {
      this.childPageList = [
        'group-introduction',
        'myclass-report',
        'class-analysis-v2',
        'cloudrun-report',
        'member-list',
        'group-architecture',
        'admin-list'
      ];
    } else if (groupDetail.brandType === 1) {
      this.childPageList = [
        'group-introduction',
        'member-list',
        'group-architecture',
        'admin-list'
      ];
    } else {
      this.childPageList = [
        'group-introduction',
        'sports-report',
        'life-tracking-v2',
        'cloudrun-report',
        'member-list',
        'group-architecture',
        'admin-list'
      ];
    }

    if (this.currentGroupInfo.groupLevel === 30 && (this.user.accessRight[0] <= 29 || this.user.isGroupAdmin)) {
      this.childPageList.push('commerce-plan');
    }
    
  }

  /**
   * 取得子頁面清單各選項按鈕寬度
   * @author kidin-1091030
   */
  getPerPageOptSize() {

    setTimeout(() => {
      const menuList = document.querySelectorAll('.main__page__list');
      this.uiFlag.barWidth = menuList[0].clientWidth;
      menuList.forEach(_menu => {
        this.perPageOptSize.perSize.push(_menu.clientWidth);
        this.perPageOptSize.total += _menu.clientWidth;
      });

      this.checkScreenSize();
    })

  }

  /**
   * 取得使用者在此群組和關聯群組之狀態
   * @params groupList {Array<object>}
   * @returns joinStatus {number}
   * @author kidin-1090811
   */
  getJoinStatus(groupList: Array<GroupAccessRightList>): number {
    const belongGroup = groupList.filter(_list => _list.groupId === this.currentGroupInfo.groupId);
    console.log('belongGroup', belongGroup);
    return belongGroup[0] ? belongGroup[0].joinStatus : 5;
  }

  /**
   * 使用者加入或退出群組
   * @event click
   * @author kidin-1090811
   */
  handleJoinGroup(actionType: number) {
    const body = {
      token: this.user.token,
      groupId: this.currentGroupInfo.groupId,
      brandType: this.currentGroupInfo.groupDetail.brandType,
      actionType
    };

    this.groupService.actionGroup(body).subscribe(res => {
      console.log('handleJoinGroup', res);
      if (res.resultCode !== 200) {
        this.openAlert(errMsg);
        console.log(`${res.resultCode}: ${res.resultMessage}`);
      } else {
        this.userProfileService.refreshUserProfile({token: this.user.token});
      }

    });

  }

  /**
   * 導向使用者點選的群組頁面
   * @param groupId {string}
   * @event click
   * @author kidin-1090811
   */
  handleNavigation(groupId: string) {
    console.log('handleNavigation', groupId, this.hashIdService.handleGroupIdEncode(groupId));
    this.router.navigateByUrl(
      `/dashboard/group-info-v2/${this.hashIdService.handleGroupIdEncode(groupId)}/group-introduction`
    );

  }

  /**
   * 根據使用者點選的頁面顯示內容
   * @param e {MouseEvent}
   * @param page {string}-子頁面
   * @param tagIdx {number}-tag的顯示序
   * @author kidin-1090811
   */
  handleShowContent(e: MouseEvent, page: string, tagIdx: number) {
    e.stopPropagation();
    this.getBtnPosition(tagIdx);
    this.uiFlag.currentPage = page;
    this.uiFlag.currentTagIndex = tagIdx;
    this.uiFlag.showMorePageOpt = false;
    this.router.navigateByUrl(`/dashboard/group-info-v2/${this.currentGroupInfo.hashGroupId}/${page}`);
  }

  /**
   * 取得頁面tag位置
   * @param tagIdx {number}-tag的顯示序
   * @author kidin-1091102
   */
  getBtnPosition(tagIdx: number) {
    if (this.uiFlag.divideIndex === null || tagIdx < this.uiFlag.divideIndex) {

      setTimeout(() => {
        const tagPosition = document.querySelectorAll('.main__page__list');
        this.uiFlag.barWidth = tagPosition[tagIdx].clientWidth;
        let frontSize = 0;
        for (let i = 0; i < tagIdx; i++) {
          frontSize += tagPosition[i].clientWidth;
        }

        this.uiFlag.barPosition = frontSize;

      });
      
    } else {
      this.getSeeMorePosition();
    }
    
  }

  /**
   * 取得"更多"按鈕的大小和位置，使active bar可以對齊
   * @author kidin-1091102
   */
  getSeeMorePosition() {

    setTimeout(() => {
      const pageListBar = this.pageListBar.nativeElement,
            seeMoreTag = this.seeMore.nativeElement;
      this.uiFlag.barWidth = seeMoreTag.clientWidth;
      this.uiFlag.barPosition = seeMoreTag.getBoundingClientRect().left - pageListBar.getBoundingClientRect().left;
    });
    
  }

  /**
   * 顯示或隱藏更多列表
   * @param e {MouseEvent}
   * @author kidin-1091030
   */
  handleShowMorePageOpt(e: MouseEvent) {
    e.stopPropagation();

    if (this.uiFlag.showMorePageOpt) {
      this.uiFlag.showMorePageOpt = false;
    } else {
      this.uiFlag.showMorePageOpt = true;
    }

  }

  /**
   * 跳出提示視窗
   * @param msg {string}-欲顯示的訊息
   * @author kidin-1090811
   */
  openAlert(msg: string) {
    this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: 'Message',
        body: msg,
        confirmText: this.translate.instant(
          'universal_operating_confirm'
        )
      }
    });

  }

  /**
   * 顯示分享群組qrcode
   * @author kidin-1091102
   */
  openShareGroupInfoDialog() {
    let totalGroupName:string;
    switch (this.currentGroupInfo.groupLevel) {
      case 30:
        totalGroupName = this.currentGroupInfo.groupDetail.groupName;
        break;
      case 40:
        totalGroupName = `${
          this.currentGroupInfo.groupDetail.groupRootInfo[2].brandName
        }-${
          this.currentGroupInfo.groupDetail.groupName
        }`;
        break;
      case 60:
        totalGroupName = `${
          this.currentGroupInfo.groupDetail.groupRootInfo[2].brandName
        }-${
          this.currentGroupInfo.groupDetail.groupRootInfo[3].branchName
        }-${
          this.currentGroupInfo.groupDetail.groupName
        }`;
        break;
    }

    this.dialog.open(ShareGroupInfoDialogComponent, {
      hasBackdrop: true,
      data: {
        url: location.href,
        title: this.translate.instant('universal_operating_share'),
        totalGroupName: totalGroupName || '',
        cancelText: this.translate.instant('universal_operating_cancel')
      }

    });

  }

  /**
   * 1. 移除訂閱
   * @author kidin-20200710
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
