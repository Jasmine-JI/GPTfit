import { Component, OnInit, OnDestroy } from '@angular/core';

import { GroupDetailInfo, UserSimpleInfo, MemberInfo } from '../../../models/group-detail';
import { GroupService } from '../../../services/group.service';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { Subject, combineLatest, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const errMsg = `Error.<br />Please try again later.`;

@Component({
  selector: 'app-member-list',
  templateUrl: './member-list.component.html',
  styleUrls: ['./member-list.component.scss', '../group-child-page.scss']
})
export class MemberListComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  /**
   * UI會用到的各個flag
   */
  uiFlag = {
    editMode: <'complete' | 'edit'>'complete',
    seeMoreMember: false,
    seeMoreWaitMember: false
  };

  /**
   * 此群組相關資料
   */
  groupInfo = <GroupDetailInfo>{};

  /**
   * 使用者個人資訊（含權限）
   */
  userSimpleInfo: UserSimpleInfo;

  /**
   * 一般成員列表
   */
  normalMemberList: Array<MemberInfo> = [];

  /**
   * 待加入成員列表
   */
  waitMemberList: Array<MemberInfo> = [];

  constructor(
    private groupService: GroupService,
    private utils: UtilsService
  ) { }

  ngOnInit(): void {
    this.initPage();
  }

  /**
   * 取得已儲存的群組詳細資訊、階層群組資訊、使用者資訊
   * @author kidin-1091020
   */
  initPage() {
    combineLatest([
      this.groupService.getRxGroupDetail(),
      this.groupService.getRxCommerceInfo(),
      this.groupService.getUserSimpleInfo(),
      this.groupService.getRXNormalMemberList()
    ]).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(resArr => {
      Object.assign(resArr[0], {groupLevel: this.utils.displayGroupLevel(resArr[0].groupId)});
      Object.assign(resArr[0], {expired: resArr[1].expired});
      Object.assign(resArr[0], {commerceStatus: resArr[1].commerceStatus});
      this.sortMember(resArr[3]);
      this.groupInfo = resArr[0];
      this.userSimpleInfo = resArr[2];

    })

  }

  /**
   * 取得管理員和成員名單
   * @param groupArchitecture {GroupArchitecture}-api 1103的群組階層（subGroupInfo）
   * @author kidin-1091111
   */
  refreshList() {
    const adminBody = {
      token: this.userSimpleInfo.token,
      groupId: this.groupInfo.groupId,
      groupLevel: this.utils.displayGroupLevel(this.groupInfo.groupId),
      infoType: 2,
      avatarType: 3
    }

    const memberBody = {
      token: this.userSimpleInfo.token,
      groupId: this.groupInfo.groupId,
      groupLevel: this.utils.displayGroupLevel(this.groupInfo.groupId),
      infoType: 3,
      avatarType: 3
    }

    forkJoin([
      this.groupService.fetchGroupMemberList(adminBody),
      this.groupService.fetchGroupMemberList(memberBody)
    ]).subscribe(resArr => {
      if (resArr[0].resultCode !== 200 || resArr[1].resultCode !== 200) {
        this.utils.openAlert(errMsg);
        console.error(`${resArr[0].resultCode}: Api ${resArr[0].apiCode} ${resArr[0].resultMessage}`);
        console.error(`${resArr[1].resultCode}: Api ${resArr[1].apiCode} ${resArr[1].resultMessage}`);
      } else {
        this.groupService.setAdminList(resArr[0].info.groupMemberInfo);
        this.groupService.setNormalMemberList(resArr[1].info.groupMemberInfo);
      }

    })

  }

  /**
   * 將成員依加入狀態分類
   * @param memArr {Array<MemberInfo>}-api 1103回應的groupMemberInfo內容
   * @author kidin-1091111
   */
  sortMember(memArr: Array<MemberInfo>) {
    this.initList();
    memArr.forEach(_mem => {
      if (_mem.joinStatus === 2) {
        this.normalMemberList.push(_mem);
      } else if (_mem.joinStatus === 1) {
        this.waitMemberList.push(_mem);
      }

    });

  }

  /**
   * 將各類成員清單初始化
   * @author kidin-1091112
   */
  initList() {
    this.normalMemberList.length = 0;
    this.waitMemberList.length = 0;
  }

  /**
   * 開啟或關閉編輯模式
   * @author kidin-1091111
   */
  handleEdit() {
    if (this.uiFlag.editMode === 'complete') {
      this.uiFlag.editMode = 'edit';
      this.groupService.setEditMode('edit');
    } else {
      this.uiFlag.editMode = 'complete'
      this.groupService.setEditMode('complete');
    }
  }

  /**
   * 指派為管理員
   * @param e {}
   * @author kidin-1091111
   */
  handleAssignAdmin(e: number) {
    this.refreshList();
  }

  /**
   * 加入或拒絕成員
   * @param e
   * @author kidin-1091111
   */
  handleWaittingMemberInfo(e) {
    this.refreshList();
  }

  /**
   * 點擊看更多顯示所有人列表
   * @param type {'Member' | 'WaitMember'}-看更多的類別
   * @author kidin-1091201
   */
  seeMore(type: 'Member' | 'WaitMember') {
    this.uiFlag[`seeMore${type}`] = true;
  }


  /**
   * 取消rxjs訂閱
   * @author kidin-1091112
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
