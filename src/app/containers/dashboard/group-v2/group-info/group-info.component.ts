import { Component, OnInit, OnDestroy, ElementRef, AfterViewChecked } from '@angular/core';
import { fromEvent, Subscription, Subject } from 'rxjs';
import { tap, map, takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';

import { GroupDetailInfo } from '../../models/group-detail';

import { UtilsService } from '@shared/services/utils.service';
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

  private ngUnsubscribe = new Subject();
  pageResize: Subscription;
  descSectionResize: Subscription;

  currentContentPage = 'group-architecture';

  /**
   * 使用者在此群組的身份資料
   * @author kidin-1090810
   */
  user = {
    token: '',
    accessRight: [],
    joinStatus: 2,
    isGroupAdmin: false
  };

  /**
   * 操控頁面UI的flag
   * @author kidin-1090810
   */
  uiFlag = {
    isSmallScreen: false,
    isShowMoreIntroduction: false,
    listFold: {
      groupName: false,
      groupIntroduction: false,
      groupMenu: false
    }
  };

  /**
   * 此群組相關資料
   * @author kidin-1090810
   */
  currentGroupInfo = {
    groupId: '',
    hashGroupId: '',
    groupLevel: 99,
    groupDetail: <GroupDetailInfo>{},
    allGroupInfo: {}
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
    this.checkScreenSize();
    this.handlePageResize();
    this.detectUrlChange();
    this.handleShowContent('group-architecture');

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

  }

  ngAfterViewChecked() {
    this.handleDescSectionResize();
  }

  /**
   * 判斷瀏覽器頁面大小
   * @author kidin-20200714
   */
  checkScreenSize() {
    if (document.body.clientWidth <= 767) {
      this.uiFlag.isSmallScreen = true;
      this.uiFlag.listFold = {
        groupName: true,
        groupIntroduction: true,
        groupMenu: true
      };
    } else {
      this.uiFlag.isSmallScreen = false;
      this.uiFlag.listFold = {
        groupName: false,
        groupIntroduction: false,
        groupMenu: false
      };
    }

  }

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
   * 處理側邊欄的收合
   * @event click
   * @param section { string } 收合展開的區塊
   * @author kidin-20200709
  */
  handleFold(section: string): void {
    if (this.uiFlag.listFold[section] === false) {
      this.uiFlag.listFold[section] = true;
    } else {
      this.uiFlag.listFold[section] = false;
    }

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
        this.handleDescSectionResize();
        console.log('groupDetail', this.currentGroupInfo.groupDetail);
      }

    });

  }

  /**
   * 偵測介紹區塊高度並針對過高情況限制高度
   * @author kidin-1090811
   */
  handleDescSectionResize() {
    if (this.uiFlag.isShowMoreIntroduction === false) {
      const sectionHeight = document.getElementById('group__desc').clientHeight;
      if (sectionHeight < 70 && sectionHeight > 0) {
        this.uiFlag.isShowMoreIntroduction = true;
      }

    }

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
  }

  /**
   * 根據url對應選單
   * @author kidin-1090813
   */
  getCurrentContentPage(): void {
    const arr = location.pathname.split('/');
    this.currentContentPage = arr[arr.length - 1];
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
      `/dashboard/group-info-v2/${this.hashIdService.handleGroupIdEncode(groupId)}/group-architecture`
    );

  }

  /**
   * 根據使用者點選的頁面顯示內容
   * @param content {string}
   * @author kidin-1090811
   */
  handleShowContent(content: string) {
    console.log('handleShowContent', this.currentGroupInfo.hashGroupId);
    this.router.navigateByUrl(`/dashboard/group-info-v2/${this.currentGroupInfo.hashGroupId}/${content}`);
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
   * 點擊觀看更多後將群組介紹全顯示
   * @event click
   * @author kidin-1090811
   */
  handleSeeMore() {
    this.uiFlag.isShowMoreIntroduction = true;
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
