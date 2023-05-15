import { Component, OnInit, OnDestroy } from '@angular/core';
import { GroupDetailInfo, GroupArchitecture, UserSimpleInfo } from '../../../models/group-detail';
import { HashIdService, Api11xxService, HintDialogService } from '../../../../../core/services';
import { Router } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GroupIdSlicePipe } from '../../../../../core/pipes';
import { MessageBoxComponent } from '../../../../../shared/components/message-box/message-box.component';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ProfessionalService } from '../../../../professional/services/professional.service';
import { displayGroupLevel } from '../../../../../core/utils';

const errMsg = `Error.<br />Please try again later.`;

@Component({
  selector: 'app-group-architecture',
  templateUrl: './group-architecture.component.html',
  styleUrls: ['./group-architecture.component.scss', '../group-child-page.scss'],
})
export class GroupArchitectureComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  /**
   * UI會用到的各個flag
   */
  uiFlag = {
    editMode: <'complete' | 'edit'>'complete',
    branchFull: false,
    classFull: false,
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
    private api11xxService: Api11xxService,
    private hintDialogService: HintDialogService,
    private router: Router,
    private hashIdService: HashIdService,
    private groupIdSlicePipe: GroupIdSlicePipe,
    private dialog: MatDialog,
    private translateService: TranslateService,
    private professionalService: ProfessionalService
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
      this.professionalService.getAllLevelGroupData(),
      this.professionalService.getUserSimpleInfo(),
    ])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((resArr) => {
        Object.assign(resArr[0], { groupLevel: displayGroupLevel(resArr[0].groupId) });
        Object.assign(resArr[0], { expired: resArr[1].expired });
        Object.assign(resArr[0], { commerceStatus: resArr[1].commerceStatus });
        this.groupInfo = resArr[0];
        this.groupArchitecture = this.checkParentsGroup(resArr[2]);
        this.userSimpleInfo = resArr[3];
        this.checkGroupNum(resArr[1].groupStatus);
      });
  }

  /**
   * 在子群組加入對應的父群組資訊
   * @param groupArchitecture {GroupArchitecture}-api 1103的群組階層（subGroupInfo）
   * @author kidin-1091201
   */
  checkParentsGroup(groupArchitecture: GroupArchitecture) {
    groupArchitecture.coaches.map((_coach) => {
      groupArchitecture.branches.forEach((_branch) => {
        if (
          this.groupIdSlicePipe.transform(_coach.groupId, 4) ===
          this.groupIdSlicePipe.transform(_branch.groupId, 4)
        ) {
          Object.assign(_coach, { branchName: _branch.groupName });
        }
      });

      return _coach;
    });

    return groupArchitecture;
  }

  /**
   * 確認群組建立數目是否超過方案限制
   * @param groupStatus {any}-群組建立數目的狀態
   * @author kidin-1091130
   */
  checkGroupNum(groupStatus: any) {
    if (+groupStatus.currentBranches >= +groupStatus.maxBranches) {
      this.uiFlag.branchFull = true;
    } else {
      this.uiFlag.branchFull = false;
    }

    if (+groupStatus.currentClasses >= +groupStatus.maxClasses) {
      this.uiFlag.classFull = true;
    } else {
      this.uiFlag.classFull = false;
    }
  }

  /**
   * 開啟編輯模式或送出request並關閉編輯模式
   * @author kidin-1091103
   */
  handleEdit() {
    if (this.uiFlag.editMode === 'complete') {
      this.uiFlag.editMode = 'edit';
      this.professionalService.setEditMode('edit');
    } else {
      this.uiFlag.editMode = 'complete';
      this.professionalService.setEditMode('complete');
    }
  }

  /**
   * 解散群組
   * @param e {any}
   * @author kidin-1091105
   */
  disbandGroup(e: any) {
    if (this.groupInfo.groupId === e) {
      this.router.navigateByUrl('/dashboard/my-group-list');
    } else {
      this.refreshGroupDetail();
      this.refreshAllLevelGroupData();
    }
  }

  /**
   * 新增子群組
   * @param type {string}-新建群組的類別
   * @author kidin-1091105
   */
  addGroup(type: string) {
    const { groupId, brandType } = this.groupInfo;
    if (type === 'branch') {
      this.router.navigateByUrl(
        `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(
          groupId
        )}/group-introduction?createType=branch&brandType=${brandType}`
      );
    } else if (type === 'class' && brandType === 2) {
      this.router.navigateByUrl(
        `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(
          groupId
        )}/group-introduction?createType=department&brandType=${brandType}`
      );
    } else {
      this.translateService
        .get('hellow world')
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe(() => {
          this.dialog.open(MessageBoxComponent, {
            hasBackdrop: true,
            data: {
              title: this.translateService.instant('universal_group_disclaimer'),
              body: this.translateService.instant('universal_group_createClassStatement'),
              confirmText: this.translateService.instant('universal_operating_agree'),
              cancelText: this.translateService.instant('universal_operating_disagree'),
              onConfirm: () => {
                this.router.navigateByUrl(
                  `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(
                    groupId
                  )}/group-introduction?createType=coach`
                );
              },
            },
          });
        });

      /* 1100714移除建立"專業老師"階層群組
        this.bottomSheet.open(BottomSheetComponent, {
          data: { groupId: this.groupInfo.groupId }
        });
      */
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
      avatarType: 3,
    };

    this.api11xxService.fetchGroupListDetail(body).subscribe((res) => {
      if (res.resultCode !== 200) {
        this.hintDialogService.openAlert(errMsg);
        console.error(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
      } else {
        this.professionalService.saveGroupDetail(res.info);
      }
    });
  }

  /**
   * 儲存所有階層群組資訊
   * @author kidin-1090716
   */
  refreshAllLevelGroupData() {
    const body = {
      token: this.userSimpleInfo.token,
      avatarType: 3,
      groupId: this.groupInfo.groupId,
      groupLevel: this.groupInfo.groupLevel,
      infoType: 1,
    };

    this.api11xxService.fetchGroupMemberList(body).subscribe((res) => {
      if (res.resultCode !== 200) {
        this.hintDialogService.openAlert(errMsg);
        console.error(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
      } else {
        this.professionalService.setAllLevelGroupData(res.info.subGroupInfo);
      }
    });
  }

  /**
   * 取消rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
