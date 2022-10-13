import { Component, OnInit, OnDestroy } from '@angular/core';
import { GroupDetailInfo, UserSimpleInfo } from '../../../models/group-detail';
import { GroupService } from '../../../../../shared/services/group.service';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SelectDate } from '../../../../../shared/models/utils-type';

const errMsg = `Error.<br />Please try again later.`;

@Component({
  selector: 'app-commerce-plan',
  templateUrl: './commerce-plan.component.html',
  styleUrls: ['./commerce-plan.component.scss', '../group-child-page.scss'],
})
export class CommercePlanComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  /**
   * UI會用到的各個flag
   */
  uiFlag = {
    editMode: false,
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
   * 群組方案狀態
   */
  commerceInfo: any;

  /**
   * 目前管理員總數
   */
  totalAdmin = 0;

  /**
   * 送出api 1116的req body
   */
  editBody = {
    token: '',
    groupId: '',
    commercePlan: 1,
    commercePlanExpired: '',
    commerceStatus: 1,
    groupSetting: {
      maxBranches: 1,
      maxClasses: 2,
      maxGeneralGroups: 0,
    },
    groupManagerSetting: {
      maxGroupManagers: 4,
    },
    groupMemberSetting: {
      maxGroupMembers: 20,
    },
    groupAllMemberSetting: {
      maxAllGroupMembers: 100,
    },
  };

  constructor(private groupService: GroupService, private utils: UtilsService) {}

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
    ])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((resArr) => {
        this.groupInfo = resArr[0];
        this.commerceInfo = resArr[1];
        this.userSimpleInfo = resArr[2];
        this.countTotalAdminNum(this.commerceInfo);
      });
  }

  /**
   * 計算所有管理員加總數量
   * @param commerce {any}
   * @author kidin-1091112
   */
  countTotalAdminNum(commerce: any) {
    const admin = commerce.groupManagerStatus;
    this.totalAdmin = 0;
    for (const _admin in admin) {
      if (Object.prototype.hasOwnProperty.call(admin, _admin)) {
        if (_admin.indexOf('current') > -1) {
          this.totalAdmin += +admin[_admin];
        }
      }
    }
  }

  /**
   * 開啟或關閉編輯模式並儲存設定
   * @author kidin-1091111
   */
  handleEdit() {
    if (this.uiFlag.editMode) {
      this.savePlanSetting();
    } else {
      this.uiFlag.editMode = true;
      this.groupService.setEditMode('edit');
      this.handleEditBody();
      if (+this.editBody.commercePlan === 99) {
        setTimeout(() => {
          this.setReadonly(false);
        }, 0);
      } else {
        setTimeout(() => {
          this.setReadonly(true);
        }, 0);
      }
    }
  }

  /**
   * 將部份方案狀況複製到editBody
   * @author kidin-1091112
   */
  handleEditBody() {
    this.editBody = {
      token: this.userSimpleInfo.token,
      groupId: this.groupInfo.groupId,
      commercePlan: this.commerceInfo.commercePlan,
      commercePlanExpired: this.commerceInfo.commercePlanExpired,
      commerceStatus: this.commerceInfo.commerceStatus,
      groupSetting: {
        maxBranches: this.commerceInfo.groupStatus.maxBranches,
        maxClasses: this.commerceInfo.groupStatus.maxClasses,
        maxGeneralGroups: 0,
      },
      groupManagerSetting: {
        maxGroupManagers: this.commerceInfo.groupManagerStatus.maxGroupManagers,
      },
      groupMemberSetting: {
        maxGroupMembers: this.commerceInfo.groupMemberStatus.maxGroupMembers,
      },
      groupAllMemberSetting: {
        maxAllGroupMembers: this.commerceInfo.groupAllMemberSetting?.maxAllGroupMembers || 100,
      },
    };
  }

  /**
   * 取消並關閉編輯模式
   * @author kidin-1091103
   */
  handleCancelEdit() {
    this.uiFlag.editMode = false;
    this.groupService.setEditMode('close');
  }

  /**
   * 取得使用者選擇的日期
   * @param e {SelectDate}-使用者選擇的日期
   * @author kidin-1091112
   */
  getSelectDate(e: SelectDate) {
    this.editBody.commercePlanExpired = e.startDate;
  }

  // 若為客製方案，則允許編輯其他欄位，其他方案則固定內容-kidin-1090409
  editManageContent(e) {
    switch (e.value) {
      case '1':
        this.editBody.groupSetting.maxBranches = 1;
        this.editBody.groupSetting.maxClasses = 2;
        this.editBody.groupManagerSetting.maxGroupManagers = 4;
        this.editBody.groupMemberSetting.maxGroupMembers = 20;
        this.setReadonly(true);
        break;
      case '2':
        this.editBody.groupSetting.maxBranches = 3;
        this.editBody.groupSetting.maxClasses = 10;
        this.editBody.groupManagerSetting.maxGroupManagers = 25;
        this.editBody.groupMemberSetting.maxGroupMembers = 1000;
        this.setReadonly(true);
        break;
      case '3':
        this.editBody.groupSetting.maxBranches = 10;
        this.editBody.groupSetting.maxClasses = 80;
        this.editBody.groupManagerSetting.maxGroupManagers = 200;
        this.editBody.groupMemberSetting.maxGroupMembers = 10000;
        this.setReadonly(true);
        break;
      case '99':
        this.setReadonly(false);
        break;
    }
  }

  // 若非客製方案則不允許方案內容編輯-kidin-1090409
  setReadonly(action) {
    const planContent = document.querySelectorAll('.editManageInput input');
    if (action) {
      for (let i = 0; i < planContent.length; i++) {
        planContent[i].setAttribute('readonly', 'readonly');
        planContent[i].setAttribute('style', 'color: #919191;');
      }
    } else {
      for (let i = 0; i < planContent.length; i++) {
        planContent[i].removeAttribute('readonly');
        planContent[i].setAttribute('style', 'color: black;');
      }
    }
  }

  /**
   * 儲存方案各類數量設定
   * @param e {Event}
   * @param type {string}-設定類別
   * @author kidin-1091112
   */
  saveNumSetting(e: Event, type: 'adminNum' | 'memberNum' | 'branchNum' | 'classNum') {
    const num = (e as any).target.value;
    switch (type) {
      case 'adminNum':
        if (num < 4 || num > 1000) {
          this.editBody.groupManagerSetting.maxGroupManagers = 4;
        } else {
          this.editBody.groupManagerSetting.maxGroupManagers = num;
        }
        break;
      case 'memberNum':
        if (num < 20 || num > 100000) {
          this.editBody.groupAllMemberSetting.maxAllGroupMembers = 100;
        } else {
          this.editBody.groupAllMemberSetting.maxAllGroupMembers = num;
        }
        break;
      case 'branchNum':
        if (num < 1 || num > 100) {
          this.editBody.groupSetting.maxBranches = 1;
        } else {
          this.editBody.groupSetting.maxBranches = num;
        }
        break;
      case 'classNum':
        if (num < 2 || num > 500) {
          this.editBody.groupSetting.maxClasses = 2;
        } else {
          this.editBody.groupSetting.maxClasses = num;
        }
        break;
    }
  }

  /**
   * 送出api 1116並關閉編輯模式
   * @author kidin-1091112
   */
  savePlanSetting() {
    this.groupService.editGroupManage(this.editBody).subscribe((res) => {
      if (res.resultCode !== 200) {
        console.error(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
        this.utils.openAlert(errMsg);
      } else {
        this.uiFlag.editMode = false;
        this.groupService.setEditMode('complete');
      }
    });
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
