import { Component, OnInit, OnDestroy } from '@angular/core';
import { GroupDetailInfo, UserSimpleInfo, MemberInfo } from '../../../models/group-detail';
import { GroupService } from '../../../services/group.service';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, first } from 'rxjs/operators';

@Component({
  selector: 'app-admin-list',
  templateUrl: './admin-list.component.html',
  styleUrls: ['./admin-list.component.scss', '../group-info.component.scss']
})
export class AdminListComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  /**
   * UI會用到的各個flag
   */
  uiFlag = {
    editMode: false
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
      this.groupService.getUserSimpleInfo()
    ]).pipe(
      first(),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(resArr => {
      Object.assign(resArr[0], {groupLevel: this.utils.displayGroupLevel(resArr[0].groupId)});
      Object.assign(resArr[0], {expired: resArr[1].expired});
      Object.assign(resArr[0], {commerceStatus: resArr[1].commerceStatus});
      this.groupInfo = resArr[0];
      this.userSimpleInfo = resArr[2];
      this.getAdminList();
    })

  }

  /**
   * 取得成員名單
   * @author kidin-1091111
   */
  getAdminList() {
    const body = {
      token: this.userSimpleInfo.token,
      groupId: this.groupInfo.groupId,
      groupLevel: this.utils.displayGroupLevel(this.groupInfo.groupId),
      infoType: 2,
      avatarType: 3
    }

    this.groupService.fetchGroupMemberList(body).subscribe(res => {
      if (res.resultCode !== 200) {
        console.log(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
      } else {
        console.log('adminList', res);
        this.sortMember(res.info.groupMemberInfo);
      }
      
    });

  }

  /**
   * 將成員依加入狀態分類
   * @param memArr {Array<MemberInfo>}-api 1103回應的groupMemberInfo內容
   * @author kidin-1091111
   */
  sortMember(memArr: Array<MemberInfo>) {
    this.initList();
    memArr.forEach(_mem => {
      switch (+_mem.accessRight) {
        case 30:
          this.adminList.brand.push(_mem);
          break;
        case 40:
          this.adminList.branch.push(_mem);
          break;
        case 50:
          this.adminList.class.push(_mem);
          break;
        case 60:
          this.adminList.teacher.push(_mem);
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
   * 開啟或關閉編輯模式
   * @author kidin-1091111
   */
  handleEdit() {
    this.uiFlag.editMode = !this.uiFlag.editMode;
  }

  /**
   * 指派為管理員
   * @param e {}
   * @author kidin-1091111
   */
  handleRemoveAdmin(e: number) {
    console.log('assign admin', e);
    this.getAdminList();
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
