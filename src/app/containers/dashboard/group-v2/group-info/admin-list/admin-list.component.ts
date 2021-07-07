import { Component, OnInit, OnDestroy } from '@angular/core';
import { GroupDetailInfo, UserSimpleInfo, MemberInfo, GroupArchitecture } from '../../../models/group-detail';
import { GroupService } from '../../../services/group.service';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { Subject, combineLatest, forkJoin } from 'rxjs';
import { takeUntil, first } from 'rxjs/operators';
import { GroupIdSlicePipe } from '../../../../../shared/pipes/group-id-slice.pipe';

const errMsg = `Error.<br />Please try again later.`;

@Component({
  selector: 'app-admin-list',
  templateUrl: './admin-list.component.html',
  styleUrls: ['./admin-list.component.scss', '../group-child-page.scss']
})
export class AdminListComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  /**
   * UI會用到的各個flag
   */
  uiFlag = {
    editMode: <'complete' | 'edit'>'complete'
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
   * 群組階層簡易資訊
   */
  groupArchitecture = <GroupArchitecture>{};

  /**
   * 管理員列表
   */
  adminList = {
    brand: <Array<MemberInfo>>[],
    branch: <Array<MemberInfo>>[],
    class: <Array<MemberInfo>>[],
    teacher: <Array<MemberInfo>>[]
  }

  constructor(
    private groupService: GroupService,
    private utils: UtilsService,
    private groupIdSlicePipe: GroupIdSlicePipe
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
      this.groupService.getAllLevelGroupData(),
      this.groupService.getRXAdminList()
    ]).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(resArr => {
      Object.assign(resArr[0], {groupLevel: this.utils.displayGroupLevel(resArr[0].groupId)});
      Object.assign(resArr[0], {expired: resArr[1].expired});
      Object.assign(resArr[0], {commerceStatus: resArr[1].commerceStatus});
      this.groupInfo = resArr[0];
      this.userSimpleInfo = resArr[2];
      this.groupArchitecture = resArr[3];
      this.sortMember(resArr[4], this.groupArchitecture);
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
   * @param groupArchitecture {GroupArchitecture}-api 1103的群組階層（subGroupInfo）
   * @author kidin-1091111
   */
  sortMember(memArr: Array<MemberInfo>, groupArchitecture: GroupArchitecture) {
    this.initList();
    memArr.forEach(_mem => {
      switch (+_mem.accessRight) {
        case 30:
          this.adminList.brand.push(_mem);
          break;
        case 40:
          _mem = this.getGroupName(_mem, groupArchitecture, 40);
          if (_mem !== null) {
            this.adminList.branch.push(_mem);
          }
          
          break;
        case 50:
          _mem = this.getGroupName(_mem, groupArchitecture, 50);
          if (_mem !== null) {
            this.adminList.class.push(_mem);
          }

          break;
        case 60:
          _mem = this.getGroupName(_mem, groupArchitecture, 60);
          if (_mem !== null) {
            this.adminList.teacher.push(_mem);
          }

          break;
      }

    });

  }

  /**
   * 將各類成員清單初始化
   * @author kidin-1091112
   */
  initList() {
    this.adminList = {
      brand: [],
      branch: [],
      class: [],
      teacher: []
    }

  }

  /**
   * 取得該管理員所屬群組名稱及篩掉群組已解散的管理員
   * @param member {MemberInfo}-管理員簡易資訊
   * @param groupArchitecture {GroupArchitecture}-api 1103的群組階層（subGroupInfo）
   * @param groupLevel {number}-群組階層
   * @author kidin-1091201
   */
  getGroupName(member: MemberInfo, groupArchitecture: GroupArchitecture, groupLevel: number) {
    let haveGroup = false;
    if (groupLevel === 40) {

      const branches = groupArchitecture.branches,
            branchesLength = branches.length;
      for (let i = 0; i < branchesLength; i++) {

        if (member.groupId === branches[i].groupId) {
          haveGroup = true;
          Object.assign(member, {branchName: branches[i].groupName});
          break;
        }

      }

    } else {
      const branches = groupArchitecture.branches,
            branchesLength = branches.length,
            coaches = groupArchitecture.coaches,
            coachesLength = coaches.length;
      for (let i = 0; i < coachesLength; i++) {

        if (member.groupId === coaches[i].groupId) {
          haveGroup = true;
          Object.assign(member, {coachName: coaches[i].groupName});

          for (let j = 0; j < branchesLength; j++) {

            if (this.groupIdSlicePipe.transform(member.groupId, 4) === this.groupIdSlicePipe.transform(branches[j].groupId, 4)) {
              Object.assign(member, {branchName: branches[j].groupName});
              break;
            }
    
          }

        }

      }

    }
    
    if (haveGroup) {
      return member;
    } else {
      return null;
    }

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
   * @param e {number}
   * @author kidin-1091111
   */
  handleRemoveAdmin(e: number) {
    this.refreshList();
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
