import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  GroupDetailInfo,
  UserSimpleInfo,
  MemberInfo,
  GroupArchitecture,
} from '../../../models/group-detail';
import { ProfessionalService } from '../../../../professional/services/professional.service';
import { Api11xxService, HintDialogService } from '../../../../../core/services';
import { Subject, combineLatest, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { displayGroupLevel } from '../../../../../core/utils';

const errMsg = `Error.<br />Please try again later.`;

@Component({
  selector: 'app-member-list',
  templateUrl: './member-list.component.html',
  styleUrls: ['./member-list.component.scss', '../group-child-page.scss'],
})
export class MemberListComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  /**
   * UI會用到的各個flag
   */
  uiFlag = {
    editMode: <'complete' | 'edit'>'complete',
    seeMoreMember: false,
    seeMoreWaitMember: false,
    pageType: <'normal' | 'analysis'>'normal',
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

  /**
   * 群組階層簡易資訊
   */
  groupArchitecture = <GroupArchitecture>{};

  /**
   * 群組階層
   */
  get groupLevel() {
    return displayGroupLevel(this.groupInfo.groupId);
  }

  constructor(
    private professionalService: ProfessionalService,
    private hintDialogService: HintDialogService,
    private api11xxService: Api11xxService
  ) {}

  ngOnInit(): void {
    this.initPage();
  }

  /**
   * 取得已儲存的群組詳細資訊、階層群組資訊、使用者資訊
   * @author kidin-1091020
   */
  initPage() {
    combineLatest([
      this.professionalService.getRxGroupDetail(),
      this.professionalService.getRxCommerceInfo(),
      this.professionalService.getUserSimpleInfo(),
      this.professionalService.getRXNormalMemberList(),
      this.professionalService.getAllLevelGroupData(),
    ])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((resArr) => {
        const [groupDetail, commerceInfo, userSimpleInfo, normalMemberList, allLevelGroupData] =
          resArr;
        Object.assign(groupDetail, { groupLevel: displayGroupLevel(groupDetail.groupId) });
        Object.assign(groupDetail, { expired: commerceInfo.expired });
        Object.assign(groupDetail, { commerceStatus: commerceInfo.commerceStatus });
        this.sortMember(normalMemberList);
        this.groupInfo = groupDetail;
        this.userSimpleInfo = userSimpleInfo;
        this.groupArchitecture = allLevelGroupData;
      });
  }

  /**
   * 取得管理員和成員名單
   */
  refreshList() {
    const adminBody = {
      token: this.userSimpleInfo.token,
      groupId: this.groupInfo.groupId,
      groupLevel: this.groupLevel,
      infoType: 2,
      avatarType: 3,
    };

    const memberBody = {
      token: this.userSimpleInfo.token,
      groupId: this.groupInfo.groupId,
      groupLevel: this.groupLevel,
      infoType: 3,
      avatarType: 3,
    };

    forkJoin([
      this.api11xxService.fetchGroupMemberList(adminBody),
      this.api11xxService.fetchGroupMemberList(memberBody),
    ]).subscribe((resArr) => {
      if (resArr[0].resultCode !== 200 || resArr[1].resultCode !== 200) {
        this.hintDialogService.openAlert(errMsg);
        console.error(
          `${resArr[0].resultCode}: Api ${resArr[0].apiCode} ${resArr[0].resultMessage}`
        );
        console.error(
          `${resArr[1].resultCode}: Api ${resArr[1].apiCode} ${resArr[1].resultMessage}`
        );
      } else {
        this.professionalService.setAdminList(resArr[0].info.groupMemberInfo);
        this.professionalService.setNormalMemberList(resArr[1].info.groupMemberInfo);
      }
    });
  }

  /**
   * 將成員依加入狀態分類
   * @param memArr {Array<MemberInfo>}-api 1103回應的groupMemberInfo內容
   */
  sortMember(memArr: Array<MemberInfo>) {
    this.initList();
    memArr.forEach((_mem) => {
      if (_mem.joinStatus === 2) {
        this.normalMemberList.push(_mem);
      } else if (_mem.joinStatus === 1) {
        this.waitMemberList.push(_mem);
      }
    });
  }

  /**
   * 將各類成員清單初始化
   */
  initList() {
    this.normalMemberList.length = 0;
    this.waitMemberList.length = 0;
  }

  /**
   * 開啟或關閉編輯模式
   */
  handleEdit() {
    const { pageType, editMode } = this.uiFlag;
    // 分析列表不開放編輯功能
    if (pageType === 'analysis') return;
    if (editMode === 'complete') {
      this.uiFlag.editMode = 'edit';
      this.professionalService.setEditMode('edit');
    } else {
      this.uiFlag.editMode = 'complete';
      this.professionalService.setEditMode('complete');
    }
  }

  /**
   * 指派為管理員
   * @param e
   */
  handleAssignAdmin(e: number) {
    this.refreshList();
  }

  /**
   * 加入或拒絕成員
   * @param e
   */
  handleWaittingMemberInfo(e) {
    this.refreshList();
  }

  /**
   * 點擊看更多顯示所有人列表
   * @param type {'Member' | 'WaitMember'}-看更多的類別
   */
  seeMore(type: 'Member' | 'WaitMember') {
    this.uiFlag[`seeMore${type}`] = true;
  }

  /**
   * 變更顯示內容類別
   * @param pageType {'normal' | 'analysis'}
   */
  changeContent(pageType: 'normal' | 'analysis') {
    this.uiFlag.pageType = pageType;
  }

  /**
   * 取消rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
