import { Component, OnInit, OnDestroy } from '@angular/core';

import { GroupDetailInfo, GroupArchitecture, UserSimpleInfo } from '../../../models/group-detail';
import { GroupService } from '../../../services/group.service';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { HashIdService } from '../../../../../shared/services/hash-id.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BottomSheetComponent } from '../../../../../shared/components/bottom-sheet/bottom-sheet.component';

const errMsg = `Error.<br />Please try again later.`;

@Component({
  selector: 'app-group-architecture',
  templateUrl: './group-architecture.component.html',
  styleUrls: ['./group-architecture.component.scss', '../group-child-page.scss']
})
export class GroupArchitectureComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  /**
   * UI會用到的各個flag
   */
  uiFlag = {
    editMode: false
  };

  /**
   * 目前群組的詳細資訊
   */
  groupInfo = <GroupDetailInfo>{};

  /**
   * 群組階層簡易資訊
   */
  groupArchitecture = <GroupArchitecture>{};

  /**
   * 使用者個人資訊（含權限）
   */
  userSimpleInfo: UserSimpleInfo;

  constructor(
    private groupService: GroupService,
    private utils: UtilsService,
    private router: Router,
    private hashIdService: HashIdService,
    private bottomSheet: MatBottomSheet,
  ) { }

  ngOnInit(): void {
    this.initPage();
  }

  /**
   * 取得已儲存的群組詳細資訊、階層群組資訊、使用者資訊
   * @author kidin-1091020
   */
  initPage() {
    console.log('init');
 
    combineLatest([
      this.groupService.getRxGroupDetail(),
      this.groupService.getRxCommerceInfo(),
      this.groupService.getAllLevelGroupData(),
      this.groupService.getUserSimpleInfo()
    ]).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(resArr => {
      console.log('resArr', resArr);
      Object.assign(resArr[0], {groupLevel: this.utils.displayGroupLevel(resArr[0].groupId)});
      Object.assign(resArr[0], {expired: resArr[1].expired});
      Object.assign(resArr[0], {commerceStatus: resArr[1].commerceStatus});
      this.groupInfo = resArr[0];
      console.log('groupInfo', this.groupInfo);
      this.groupArchitecture = resArr[2];
      this.userSimpleInfo = resArr[3];
    })

  }

  /**
   * 開啟編輯模式或送出request並關閉編輯模式
   * @author kidin-1091103
   */
  handleEdit() {
    this.uiFlag.editMode = !this.uiFlag.editMode;
  }

  /**
   * 解散群組
   * @param e {any}
   * @author kidin-1091105
   */
  disbandGroup(e: any) {
    console.log('disband group', e);
    this.refreshGroupDetail();
  }

  /**
   * 新增子群組
   * @param type {string}-新建群組的類別
   * @author kidin-1091105
   */
  addGroup(type: string) {
    if (type === 'branch') {
      this.router.navigateByUrl(
        `/dashboard/group-info-v2/${this.hashIdService.handleGroupIdEncode(this.groupInfo.groupId)}/group-introduction?createType=branch`
      );
    } else if (type === 'class' && this.groupInfo.brandType === 2) {
      this.router.navigateByUrl(
        `/dashboard/group-info-v2/${this.hashIdService.handleGroupIdEncode(this.groupInfo.groupId)}/group-introduction?createType=department`
      );
    } else {
      this.bottomSheet.open(BottomSheetComponent, {
        data: { groupId: this.groupInfo.groupId }
      });
    }

  }

  /**
   * 重新刷新群組資訊
   * @author kidin-1091104
   */
  refreshGroupDetail() {
    const body = {
      token: this.userSimpleInfo.token,
      groupId: this.groupInfo.groupId,
      findRoot: 1,
      avatarType: 3
    };

    this.groupService.fetchGroupListDetail(body).subscribe(res => {
      if (res.resultCode !== 200) {
        this.utils.openAlert(errMsg);
        console.log(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
      } else {
        this.groupService.saveGroupDetail(res.info);
      }

    });

  }

  /**
   * 取消rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
