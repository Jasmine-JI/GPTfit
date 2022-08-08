import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent, Subscription, Subject, forkJoin, merge } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import {
  GroupDetailInfo,
  UserSimpleInfo,
  EditMode,
  GroupLevel,
} from '../../../models/group-detail';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { GroupService } from '../../../../../shared/services/group.service';
import { HashIdService } from '../../../../../shared/services/hash-id.service';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { PeopleSelectorWinComponent } from '../../../components/people-selector-win/people-selector-win.component';
import { planDatas } from '../../../group/desc';
import dayjs from 'dayjs';
import {
  TargetField,
  GroupSportTarget,
  TargetCondition,
} from '../../../../../shared/models/sport-target';
import { ConditionSymbols } from '../../../../../shared/enum/sport-target';
import { DateUnit } from '../../../../../shared/enum/report';
import { formTest } from '../../../../../shared/models/form-test';
import { deepCopy } from '../../../../../shared/utils/index';
import { AuthService } from '../../../../../core/services/auth.service';

const errMsg = `Error.<br />Please try again later.`;

@Component({
  selector: 'app-group-introduction',
  templateUrl: './group-introduction.component.html',
  styleUrls: ['./group-introduction.component.scss', '../group-child-page.scss'],
})
export class GroupIntroductionComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  pluralEvent: Subscription;

  /**
   * placeholder用多國語系
   */
  i18n = {
    enterName: '',
    enterDesc: '',
    assignAdmin: '',
  };

  /**
   * ui需要用到的各種flag
   */
  uiFlag = {
    editMode: <EditMode>'close',
    createLevel: 60,
    contentChange: false,
    statusChange: false,
    openStatusSelector: false,
    isLoading: false,
    showInheritList: false,
    showCycleList: false,
    showFiledNameList: false,
  };

  /**
   * 表單驗證用flag
   */
  formCheck = {
    name: null,
    desc: null,
  };

  /**
   * 使用者個人資訊（含權限）
   */
  userSimpleInfo: UserSimpleInfo;

  /**
   * 頁面主要顯示的內容
   */
  groupDetail: GroupDetailInfo;

  /**
   * 編輯完成送出api 1105 的 request body
   */
  editBody = {
    token: '',
    groupLevel: null,
    groupId: '',
    groupName: '',
    groupDesc: '',
    groupVideoUrl: '',
    changeStatus: 1,
  };

  /**
   * 編輯完成送出api 1109 的 request body
   */
  createBody = {
    token: '',
    brandType: null,
    groupId: '',
    groupStatus: 2,
    groupManager: [],
    levelName: '',
    levelDesc: '',
    levelType: 5,
    coachType: null,
    commercePlan: null,
    groupSetting: {
      maxBranches: 1,
      maxClasses: 2,
      maxGeneralGroups: 0,
    },
    groupManagerSetting: {
      maxGroupManagers: null,
    },
    groupMemberSetting: {
      maxGroupMembers: null,
    },
    commercePlanExpired: '',
    shareAvatarToMember: {
      switch: 1,
      enableAccessRight: [],
      disableAccessRight: [],
    },
    shareActivityToMember: {
      switch: 2,
      enableAccessRight: [],
      disableAccessRight: [],
    },
    shareReportToMember: {
      switch: 2,
      enableAccessRight: [],
      disableAccessRight: [],
    },
  };

  /**
   * 新建群組的管理員名單
   */
  chooseLabels = [];

  /**
   * 建立品牌/企業群組所需相關設定
   */
  createBrandSetting = {
    planName: '', // 方案名稱
    planDatas: planDatas, // 群組各方案設定
    totalCost: 0, // 建立群組方案所需的花費
  };

  /**
   * 紀錄舊有目標，避免使用者取消修改
   */
  originSportsTarget: GroupSportTarget = {
    name: '',
    cycle: DateUnit.week,
    condition: [],
  };

  /**
   * 該群組運動目標
   */
  sportTarget: GroupSportTarget = {
    name: '',
    cycle: DateUnit.week,
    condition: [],
  };

  /**
   * 新的目標條件
   */
  newCondition: TargetCondition = {
    filedName: <TargetField>'',
    symbols: ConditionSymbols.greaterEqual,
    filedValue: null,
  };

  /**
   * 可繼承的目標清單
   */
  targetInheritList = [];

  readonly DateUnit = DateUnit;
  readonly GroupLevel = GroupLevel;

  constructor(
    private groupService: GroupService,
    private utils: UtilsService,
    private hashIdService: HashIdService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getGroupDetail();
    this.getUserProfile();
  }

  /**
   * 取得已儲存的群組詳細資訊和經營資訊
   * @author kidin-1091103
   */
  getGroupDetail() {
    this.groupService
      .getRxGroupDetail()
      .pipe(
        switchMap((res) =>
          this.groupService.getRxCommerceInfo().pipe(
            map((resp) => {
              Object.assign(res, { expired: resp.expired });
              Object.assign(res, { commerceStatus: +resp.commerceStatus });
              return res;
            })
          )
        ),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((res) => {
        this.groupDetail = deepCopy(res);
        this.editBody = {
          token: this.authService.token,
          groupName: this.groupDetail.groupName,
          groupId: this.groupDetail.groupId,
          groupLevel: this.utils.displayGroupLevel(this.groupDetail.groupId),
          groupDesc: this.groupDetail.groupDesc,
          groupVideoUrl: this.groupDetail.groupVideoUrl,
          changeStatus: this.groupDetail.groupStatus,
        };

        if (res.target && Object.keys(res.target).length > 0) {
          const { target } = res;
          this.originSportsTarget = deepCopy(target);
          this.sportTarget = deepCopy(target);
        }
      });
  }

  /**
   * 取得已儲存的使用者資訊
   * @author kidin-1091103
   */
  getUserProfile() {
    this.groupService
      .getUserSimpleInfo()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.userSimpleInfo = res;
        this.checkQueryString(location.search.slice(1, location.search.length));
      });
  }

  /**
   * 確認url的query string，判斷是否開啟新增群組模式
   * @author kidin-1091106
   */
  checkQueryString(query: string) {
    const queryArr = query.split('&');
    for (let i = 0, queryLength = queryArr.length; i < queryLength; i++) {
      if (queryArr[i].indexOf('createType') > -1) {
        this.checkCreateMode(queryArr[i].split('=')[1]);
      } else if (queryArr[i].indexOf('plan') > -1) {
        this.saveBrandPlan(+queryArr[i].split('=')[1]);
      } else if (queryArr[i].indexOf('brandType') > -1) {
        this.createBody.brandType = +queryArr[i].split('=')[1];
      }
    }
  }

  /**
   * 根據權限和群組類別開啟建立群組模式
   * @param type {string}-欲新建的群組type
   * @author kidin-1091106
   */
  checkCreateMode(type: string) {
    switch (type) {
      case 'brand':
        if (this.userSimpleInfo.accessRight <= 29) {
          this.openCreateMode(30);
          this.createBody.levelType = 3;
        }

        break;
      case 'branch':
        if (this.userSimpleInfo.accessRight <= 30) {
          this.assignAdmin();
          this.openCreateMode(40);
          this.createBody.levelType = 4;
        }

        break;
      case 'coach':
      case 'department':
        if (this.userSimpleInfo.accessRight <= 40) {
          this.assignAdmin();
          this.openCreateMode(60);
          this.createBody.levelType = 5;
          this.createBody.coachType = 2;
          this.createBody.shareActivityToMember.switch = 3;
          this.createBody.shareReportToMember.switch = 3;
        }

        break;
      case 'teacher':
        if (this.userSimpleInfo.accessRight <= 40) {
          this.assignAdmin();
          this.openCreateMode(60);
          this.createBody.levelType = 5;
          this.createBody.coachType = 1;
          this.createBody.shareActivityToMember.switch = 2;
          this.createBody.shareReportToMember.switch = 2;
        }

        break;
      default:
        this.closeEditMode('close');
        break;
    }
  }

  /**
   * 開啟建立群組模式
   * @param level {number}-群組階層
   * @author kidin-1091106
   */
  openCreateMode(level: number) {
    this.uiFlag.createLevel = level;
    this.openEditMode('create');
    this.createBody.token = this.userSimpleInfo.token;

    if (level <= GroupLevel.brand) {
      this.createBody.groupId = '0-0-0-0-0-0';
    } else {
      this.createBody.groupId = this.groupDetail.groupId;
      this.createBody.brandType = this.groupDetail.brandType;
      this.createBody.groupManager = this.chooseLabels.map((_user) => _user.userId);
      this.setTargetReference(level === GroupLevel.branch ? GroupLevel.brand : GroupLevel.branch);
    }

    this.getTranslate();
    this.listenPluralEvent();
  }

  /**
   * 若創建分店/分公司以下階層群組，則預設創建者為管理員
   * @author kidin-1091109
   */
  assignAdmin() {
    this.chooseLabels.length = 0;
    this.chooseLabels.push({
      groupName: 'GPTfit',
      userName: this.userSimpleInfo.nickname,
      userId: this.userSimpleInfo.userId,
    });
  }

  /**
   * 待套件載入完成再產生翻譯
   * @author kidin-1091106
   */
  getTranslate() {
    this.translate
      .get('hellow world')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.i18n = {
          enterName: `${this.translate.instant('universal_activityData_name')}`,
          enterDesc: `${this.translate.instant('universal_group_introduction')}`,
          assignAdmin: `${this.translate.instant('universal_group_assignAdmin')}`,
        };
      });
  }

  /**
   * 開啟編輯或建立群組模式
   * @author kidin1091123
   */
  openEditMode(action: 'edit' | 'create') {
    this.uiFlag.editMode = action;
    this.getTargetInheritList();
    this.groupService.setEditMode(action);
  }

  /**
   * 關閉編輯模式
   * @author kidin1091123
   */
  closeEditMode(action: 'complete' | 'close') {
    if (this.uiFlag.editMode === 'edit') {
      this.uiFlag.editMode = 'close';
      this.recoverTarget();
      this.groupService.setEditMode(action);
    } else if (this.uiFlag.editMode === 'create' && action !== 'complete') {
      this.cancelCreateMode();
    } else if (this.uiFlag.editMode === 'create' && action === 'complete') {
      this.groupService.setEditMode(action);
      this.uiFlag.editMode = 'close';
    }
  }

  /**
   * 取消新建群組
   * @author kidin-1091111
   */
  cancelCreateMode() {
    this.uiFlag.editMode = 'close';
    this.groupService.setEditMode('close');
    if (this.createBody.levelType !== 3) {
      this.router.navigateByUrl(
        `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(
          this.createBody.groupId
        )}/group-architecture`
      );
    } else {
      if (this.createBody.brandType === 1) {
        this.router.navigateByUrl(`/dashboard/system/create-brand-group`);
      } else {
        this.router.navigateByUrl(`/dashboard/system/create-com-group`);
      }
    }
  }

  /**
   * 開啟編輯模式或送出request並關閉編輯模式
   * @author kidin-1091103
   */
  handleEdit() {
    if (this.uiFlag.editMode === 'create') {
      this.checkCreateInput();
    } else if (this.uiFlag.editMode === 'edit') {
      this.checkEditInput();
    } else {
      this.openEditMode('edit');
      this.listenPluralEvent();
    }
  }

  /**
   * 確認創建群組的表單哪些欄位未輸入
   * @author kidin1091110
   */
  checkCreateInput() {
    if (
      this.formCheck.name &&
      this.formCheck.desc &&
      this.chooseLabels.length > 0 &&
      (this.createBody.levelType !== 3 ||
        (this.createBody.levelType === 3 && this.createBody.commercePlanExpired !== ''))
    ) {
      this.saveCreateContent();
    } else {
      if (this.formCheck.name === null) {
        this.formCheck.name = false;
      }

      if (this.formCheck.desc === null) {
        this.formCheck.desc = false;
      }
    }
  }

  /**
   * 確認編輯群組的表單欄位是否皆有值
   * @author kidin1091110
   */
  checkEditInput() {
    if (
      this.formCheck.name === null &&
      this.formCheck.desc === null &&
      !this.uiFlag.contentChange &&
      !this.uiFlag.statusChange
    ) {
      this.closeEditMode('complete');
    } else if (this.editBody.groupName !== '' && this.editBody.groupDesc !== '') {
      this.saveEditContent();
    }
  }

  /**
   * 偵測全域點擊事件，以收納"群組狀態"選單
   * @author kidin-20201104
   */
  listenPluralEvent() {
    const element = document.querySelector('.main__container');
    const clickEvent = fromEvent(document, 'click');
    const scrollEvent = fromEvent(element, 'scroll');
    this.pluralEvent = merge(clickEvent, scrollEvent)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.foldAllList();
        this.cancelListenPluralEvent();
      });
  }

  /**
   * 取消訂閱全域點擊事件
   * @author kidin-20201104
   */
  cancelListenPluralEvent() {
    if (this.pluralEvent) this.pluralEvent.unsubscribe();
  }

  /**
   * 將所有已顯示清單收合
   * @author kidin-1110308
   */
  foldAllList() {
    this.uiFlag.openStatusSelector = false;
    this.uiFlag.showInheritList = false;
    this.uiFlag.showCycleList = false;
    this.uiFlag.showFiledNameList = false;
  }

  /**
   * 開啟群組狀態選單
   * @param e {MouseEvent}
   * @author kidin-1091104
   */
  toggleStatusSelector(e: MouseEvent) {
    e.stopPropagation();
    const { openStatusSelector } = this.uiFlag;
    openStatusSelector ? this.closeStatusSelector() : this.openStatusSelector();
  }

  /**
   * 顯示群組狀態清單
   * @author kidin-1110308
   */
  openStatusSelector() {
    this.foldAllList();
    this.uiFlag.openStatusSelector = true;
    this.listenPluralEvent();
  }

  /**
   * 顯示群組狀態清單
   * @author kidin-1110308
   */
  closeStatusSelector() {
    this.uiFlag.openStatusSelector = false;
    this.cancelListenPluralEvent();
  }

  /**
   * 移除所選擇的管理員
   * @param idx {number}-所選的管理員序
   * @author kidin-1091106
   */
  removeLabel(idx: number) {
    this.chooseLabels.splice(idx, 1);
  }

  /**
   * 選擇完管理員並點擊確認後異動管理員名單
   * @param type {number}-選單類別
   * @param _lists {Array<Object>}-指派的管理員清單
   * @author kidin-1091109
   */
  handleConfirm(type: number, _lists: Array<Object>) {
    this.chooseLabels = _lists;
    this.createBody.groupManager = this.chooseLabels.map((_user) => _user.userId);
  }

  /**
   * 開啟管理員的選擇器
   * @param _type
   * @param e
   */
  openSelectorWin(_type: number, e) {
    e.preventDefault();
    const adminLists = this.chooseLabels.slice();
    this.dialog.open(PeopleSelectorWinComponent, {
      hasBackdrop: true,
      data: {
        title: this.i18n.assignAdmin,
        adminLevel: `${_type}`,
        adminLists,
        type: 1,
        onConfirm: this.handleConfirm.bind(this),
        isInnerAdmin: this.uiFlag.createLevel === 30 && this.userSimpleInfo.accessRight < 30,
      },
    });
  }

  /**
   * 儲存群組名稱
   * @param e {Event}
   * @author kidin-1091103
   */
  saveGroupName(e: Event) {
    if ((e as any).target.value.trim().length > 0) {
      this.formCheck.name = true;

      if (this.uiFlag.editMode === 'create') {
        this.createBody.levelName = (e as any).target.value.trim();
      } else if (this.uiFlag.editMode === 'edit') {
        this.uiFlag.contentChange = true;
        this.editBody.groupName = (e as any).target.value.trim();
      }
    } else {
      this.formCheck.name = false;
    }
  }

  /**
   * 儲存群組介紹
   * @param e {Event}
   * @author kidin-1091103
   */
  saveGroupDesc(e: Event) {
    if ((e as any).target.value.trim().length > 0) {
      this.formCheck.desc = true;

      if (this.uiFlag.editMode === 'create') {
        this.createBody.levelDesc = (e as any).target.value;
      } else if (this.uiFlag.editMode === 'edit') {
        this.uiFlag.contentChange = true;
        this.editBody.groupDesc = (e as any).target.value;
      }
    } else {
      this.formCheck.desc = false;
    }
  }

  /**
   * 儲存課程直播連結
   * @param e {Event}
   * @author kidin-1091103
   */
  saveVedioUrl(e: Event) {
    this.uiFlag.contentChange = true;
    this.editBody.groupVideoUrl = (e as any).target.value;
  }

  /**
   * 編輯群組加入狀態
   * @param e {MouseEvent}
   * @param status {number}-group join status
   * @author kidin-1091103
   */
  saveGroupStatus(e: MouseEvent, status: number) {
    e.stopPropagation();
    if (this.uiFlag.editMode === 'create') {
      this.createBody.groupStatus = status;
    } else if (this.uiFlag.editMode === 'edit') {
      this.uiFlag.statusChange = true;
      this.editBody.changeStatus = status;
    }

    this.closeStatusSelector();
  }

  /**
   * 儲存群組建立方案
   * @param plan {number}-群組建立方案
   * @author kidin-1091110
   */
  saveBrandPlan(plan: number) {
    switch (plan) {
      case 1:
        this.createBrandSetting.planName = this.translate.instant('universal_group_experiencePlan');
        break;
      case 2:
        this.createBrandSetting.planName = this.translate.instant('universal_group_studioPlan');
        break;
      case 3:
        this.createBrandSetting.planName = this.translate.instant('universal_group_smePlan');
        break;
      default:
        this.createBrandSetting.planName = this.translate.instant('universal_group_customPlan');
    }

    this.createBody.commercePlan = plan;
    if (this.createBody.commercePlan !== 99) {
      this.createBody.groupSetting.maxBranches = planDatas[plan - 1].maxBranches;
      this.createBody.groupSetting.maxClasses = planDatas[plan - 1].maxClasses;
      this.createBody.groupManagerSetting.maxGroupManagers = planDatas[plan - 1].maxGroupManagers;
      this.createBody.groupMemberSetting.maxGroupMembers = planDatas[plan - 1].maxGroupMembers;
    } else {
      // 客製群組暫時預設同中小企業方案
      this.createBody.groupSetting.maxBranches = planDatas[2].maxBranches;
      this.createBody.groupSetting.maxClasses = planDatas[2].maxClasses;
      this.createBody.groupManagerSetting.maxGroupManagers = planDatas[2].maxGroupManagers;
      this.createBody.groupMemberSetting.maxGroupMembers = planDatas[2].maxGroupMembers;
    }
  }

  /**
   * 儲存使用者點擊的方案時間
   * @param e {Event}
   */
  saveExpireTime(e: Event) {
    let date = '';
    switch ((e as any).value) {
      case '1':
        date = dayjs().add(1, 'month').format('YYYY-MM-DDTHH:mm:ss.000+08:00');
        break;
      case '2':
        date = dayjs().add(2, 'month').format('YYYY-MM-DDTHH:mm:ss.000+08:00');
        break;
      case '3':
        date = dayjs().add(3, 'month').format('YYYY-MM-DDTHH:mm:ss.000+08:00');
        break;
      case '6':
        date = dayjs().add(6, 'month').format('YYYY-MM-DDTHH:mm:ss.000+08:00');
        break;
      default:
        date = dayjs().add(12, 'month').format('YYYY-MM-DDTHH:mm:ss.000+08:00');
        break;
    }

    this.createBody.commercePlanExpired = date;
    if (this.createBody.commercePlan !== 1 && this.createBody.commercePlan !== 99) {
      this.createBrandSetting.totalCost =
        +planDatas[this.createBody.commercePlan - 1].cost * +(e as any).value;
    }
  }

  /**
   * 儲存客製方案細部設定
   * @param e {Event}
   * @param formItem {string}-變更的表單類別
   * @author kidin-1091110
   */
  savePlanSetting(e: Event, formItem: 'branch' | 'class' | 'admin' | 'member') {
    const num = (e as any).target.value,
      numReg = /\d+/;
    switch (formItem) {
      case 'branch':
        if (numReg.test(num) && num >= 1 && num <= 1000) {
          this.createBody.groupSetting.maxBranches = +num;
        } else {
          this.createBody.groupSetting.maxBranches = 10;
        }

        break;
      case 'class':
        if (numReg.test(num) && num >= 1 && num <= 50000) {
          this.createBody.groupSetting.maxClasses = +num;
        } else {
          this.createBody.groupSetting.maxClasses = 80;
        }

        break;
      case 'admin':
        if (numReg.test(num) && num >= 1 && num <= 100000) {
          this.createBody.groupManagerSetting.maxGroupManagers = +num;
        } else {
          this.createBody.groupManagerSetting.maxGroupManagers = 200;
        }

        break;
      case 'member':
        if (numReg.test(num) && num >= 1 && num <= 1000000) {
          this.createBody.groupMemberSetting.maxGroupMembers = +num;
        } else {
          this.createBody.groupMemberSetting.maxGroupMembers = 10000;
        }

        break;
    }
  }

  /**
   * 儲存建立群組的內容
   * @author kidin-1091106
   */
  saveCreateContent() {
    this.uiFlag.isLoading = true;
    Object.assign(this.createBody, { target: this.sportTarget });

    this.groupService.createGroup(this.createBody).subscribe((res) => {
      const { resultCode } = res;
      if (resultCode !== 200) {
        console.error(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
        let msg: string;
        switch (resultCode) {
          case 409:
            msg = `群組名稱重複，請更換名稱`;
            this.utils.openAlert(msg);
            break;
          default:
            msg = `Error.<br />Please check Plans status or try again later.`;
            this.utils.openAlert(msg);
            break;
        }
      } else {
        this.groupService.saveNewGroupId(res.info.newGroupId);
        this.closeEditMode('complete');
      }

      this.uiFlag.isLoading = false;
    });
  }

  /**
   * 儲存編輯內容
   * @author kidin-1091103
   */
  saveEditContent() {
    const { editBody, sportTarget: target } = this;
    const editGroupBody = deepCopy(editBody);
    if (target.name) Object.assign(editGroupBody, { target });
    const { token, groupLevel, groupId, changeStatus } = editBody;
    const changeGroupStatusBody = { token, groupLevel, groupId, changeStatus };

    delete editGroupBody.changeStatus;
    if (this.uiFlag.contentChange && !this.uiFlag.statusChange) {
      this.sendEditGroupReq(editGroupBody);
    } else if (this.uiFlag.statusChange && !this.uiFlag.contentChange) {
      this.sendchangeGroupStatusReq(changeGroupStatusBody);
    } else if (this.uiFlag.statusChange && this.uiFlag.contentChange) {
      this.sendCombinedReq(editGroupBody, changeGroupStatusBody);
    } else {
      this.closeEditMode('complete');
      this.cancelListenPluralEvent();
    }
  }

  /**
   * 送出api 1105 的request並關閉編輯模式
   * @param body {any}-api 1105 的request body
   * @author kidin-1091104
   */
  sendEditGroupReq(body: any) {
    this.uiFlag.isLoading = true;
    this.groupService.editGroup(body).subscribe((res) => {
      if (res.resultCode === 200) {
        this.initPage();
      } else {
        console.error(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
        this.utils.openAlert(errMsg);
      }

      this.uiFlag.isLoading = false;
    });
  }

  /**
   * 送出api 1107 的request並關閉編輯模式
   * @param body {any}-api 1107 的request body
   * @author kidin-1091104
   */
  sendchangeGroupStatusReq(body: any) {
    this.uiFlag.isLoading = true;
    this.groupService.changeGroupStatus(body).subscribe((res) => {
      if (res.resultCode === 200) {
        this.initPage();
        this.refreshAllLevelGroupData();
      } else {
        console.error(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
        this.utils.openAlert(errMsg);
      }

      this.uiFlag.isLoading = false;
    });
  }

  /**
   * 送出api 1105 和 api 1107 的request並關閉編輯模式
   * @param body {any}-api 1105 的request body
   * @author kidin-1091104
   */
  sendCombinedReq(editBody: any, changeBody: any) {
    this.uiFlag.isLoading = true;
    forkJoin([
      this.groupService.editGroup(editBody),
      this.groupService.changeGroupStatus(changeBody),
    ]).subscribe((res) => {
      if (res[0].resultCode === 200 && res[1].resultCode === 200) {
        this.initPage();
        this.refreshAllLevelGroupData();
      } else {
        console.error(`${res[0].resultCode}: Api-${res[0].apiCode} ${res[0].resultMessage}`);
        console.error(`${res[1].resultCode}: Api-${res[1].apiCode} ${res[1].resultMessage}`);
        this.utils.openAlert(errMsg);
      }

      this.uiFlag.isLoading = false;
    });
  }

  /**
   * 儲存所有階層群組資訊
   * @author kidin-1090716
   */
  refreshAllLevelGroupData() {
    const body = {
      token: this.editBody.token,
      avatarType: 3,
      groupId: this.editBody.groupId,
      groupLevel: this.editBody.groupLevel,
      infoType: 1,
    };

    this.groupService.fetchGroupMemberList(body).subscribe((res) => {
      if (res.resultCode !== 200) {
        this.utils.openAlert(errMsg);
        console.error(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
      } else {
        this.groupService.setAllLevelGroupData(res.info.subGroupInfo);
      }
    });
  }

  /**
   * 更新群組頁面
   * @author kidin-1091111
   */
  initPage() {
    this.refreshGroupDetail();
    this.closeEditMode('complete');
    this.uiFlag.contentChange = false;
    this.uiFlag.statusChange = false;
    this.cancelListenPluralEvent();
  }

  /**
   * 重新刷新群組資訊
   * @author kidin-1091104
   */
  refreshGroupDetail() {
    const body = {
      token: this.editBody.token,
      groupId: this.editBody.groupId,
      findRoot: 1,
      avatarType: 3,
    };

    this.groupService.fetchGroupListDetail(body).subscribe((res) => {
      if (res.resultCode !== 200) {
        this.utils.openAlert(errMsg);
        console.error(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
      } else {
        this.groupService.saveGroupDetail(res.info);
      }
    });
  }

  /**
   * 轉導至使用者點選的父群組
   * @param groupId {string}-父群組id
   * @author kidin-1091111
   */
  navigateParentsGroup(groupId: string) {
    this.closeEditMode('close');
    this.router.navigateByUrl(
      `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(groupId)}/group-introduction`
    );
  }

  /**
   * 展開/收合套用目標清單
   * @param e {MouseEvent}
   * @author kidin-1110308
   */
  toggleInheritList(e: MouseEvent) {
    e.stopPropagation();
    const { showInheritList } = this.uiFlag;
    showInheritList ? this.foldInheritList() : this.unfoldInheritList();
  }

  /**
   * 顯示套用清單
   * @author kidin-1110308
   */
  unfoldInheritList() {
    this.foldAllList();
    this.uiFlag.showInheritList = true;
    this.listenPluralEvent();
  }

  /**
   * 隱藏套用目標清單
   */
  foldInheritList() {
    this.uiFlag.showInheritList = false;
    this.cancelListenPluralEvent();
  }

  /**
   * 選擇繼承指定的運動目標
   * @param referenceLevel {GroupLevel}-欲繼承目標的階層
   * @author kidin-1110307
   */
  setTargetReference(referenceLevel: GroupLevel) {
    const targetName = `${referenceLevel}`;
    const referenceIndex = this.targetInheritList.findIndex(
      (_list) => _list.level === referenceLevel
    );
    const { cycle, condition } = deepCopy(this.targetInheritList[referenceIndex]);
    if (cycle) {
      this.sportTarget = { name: targetName, cycle, condition };
    } else {
      this.sportTarget = { name: targetName, cycle: DateUnit.week, condition: [] };
    }

    this.foldInheritList();
  }

  /**
   * 展開/收合日期計算基準清單
   * @param e {MouseEvent}
   * @author kidin-1110308
   */
  toggleCycleList(e: MouseEvent) {
    e.stopPropagation();
    const { showCycleList } = this.uiFlag;
    showCycleList ? this.foldCycleList() : this.unfoldCycleList();
  }

  /**
   * 展開日期計算基準清單
   * @author kidin-1110308
   */
  unfoldCycleList() {
    this.foldAllList();
    this.uiFlag.showCycleList = true;
    this.listenPluralEvent();
  }

  /**
   * 收合日期計算基準清單
   * @author kidin-1110308
   */
  foldCycleList() {
    this.uiFlag.showCycleList = false;
    this.cancelListenPluralEvent();
  }

  /**
   * 選擇目標條件之日期基準
   * @param cycle {DateUnit}-指定的基準序位
   * @author kidin-1110307
   */
  selectDateCycle(cycle: DateUnit) {
    this.sportTarget.cycle = cycle;
    this.setNoReference();
    this.foldCycleList();
  }

  /**
   * 展開/收合目標條件名稱清單
   * @param e {MouseEvent}
   * @author kidin-1110308
   */
  toggleFiledNameList(e: MouseEvent) {
    e.stopPropagation();
    const { showFiledNameList } = this.uiFlag;
    showFiledNameList ? this.foldFiledNameList() : this.unfoldFiledNameList();
  }

  /**
   * 展開目標條件名稱清單
   * @author kidin-1110308
   */
  unfoldFiledNameList() {
    this.foldAllList();
    this.uiFlag.showFiledNameList = true;
    this.listenPluralEvent();
  }

  /**
   * 收合目標條件名稱
   * @author kidin-1110308
   */
  foldFiledNameList() {
    this.uiFlag.showFiledNameList = false;
    this.cancelListenPluralEvent();
  }

  /**
   * 選擇新的條件名稱
   * @param field {TargetField}
   * @author kidin-1110307
   */
  selectNewConditionFiled(field: TargetField) {
    this.newCondition.filedName = field;
    if (this.newCondition.filedValue) {
      // 若條件跟時間有關，則將數值由分轉為秒
      if (field.toLowerCase().includes('time')) {
        this.newCondition.filedValue = this.newCondition.filedValue * 60;
      }

      this.addNewCondition();
    }

    this.foldFiledNameList();
  }

  /**
   * 設定目標條件之達成值
   * @param e {MouseEvent}
   * @author kidin-1110307
   */
  setNewConditionValue(e: MouseEvent) {
    const { value } = (e as any).target;
    if (formTest.number.test(value)) {
      this.newCondition.filedValue = +value;
      const { filedName, filedValue } = this.newCondition;
      if (filedName) {
        // 若目標項目跟時間有關，則將數值由分轉為秒
        if (filedName.toLocaleLowerCase().includes('time')) {
          this.newCondition.filedValue = filedValue * 60;
        }

        this.addNewCondition();
      }
    }

    (e as any).target.value = '';
  }

  /**
   * 將設定好的新條件納入目標中，若條件名稱重複則覆蓋舊條件
   * @author kidin-1110307
   */
  addNewCondition() {
    const { filedName } = this.newCondition;
    const repeatIndex = this.sportTarget.condition.findIndex(
      (_condition) => _condition.filedName === filedName
    );

    if (repeatIndex >= 0) this.deleteCondition(repeatIndex);
    const newCondition = deepCopy(this.newCondition);
    this.sportTarget.condition.push(newCondition);
    this.newCondition = {
      filedName: <TargetField>'',
      symbols: ConditionSymbols.greaterEqual,
      filedValue: null,
    };

    this.setNoReference();
  }

  /**
   * 移除指定之條件
   * @param index {number}-條件序列
   * @author kidin-1110307
   */
  deleteCondition(index: number) {
    this.sportTarget.condition.splice(index, 1);
    this.setNoReference();
  }

  /**
   * 變更條件之後，即代表此目標為自定義目標，非繼承目標
   * @author kidin-1110307
   */
  setNoReference() {
    this.uiFlag.contentChange = true;
    const { groupLevel } = this.editBody;
    const { editMode, createLevel } = this.uiFlag;
    const currentLevel = editMode === 'create' ? createLevel : groupLevel;
    this.sportTarget.name = `${currentLevel}`;
  }

  /**
   * 取得可選擇的繼承清單
   * @author kidin-1110309
   */
  getTargetInheritList() {
    this.targetInheritList = [];
    const { editMode } = this.uiFlag;
    const { groupName, groupRootInfo, target } = this.groupDetail;
    if (editMode === 'create') {
      const { createLevel } = this.uiFlag;
      switch (createLevel) {
        case GroupLevel.brand:
          break;
        case GroupLevel.class:
          const { target: brandTarget, brandName } = groupRootInfo[2];
          this.targetInheritList.unshift(
            this.checkReferenceTarget(brandTarget, brandName, GroupLevel.brand)
          );
        // 這邊不中斷（break）;
        case GroupLevel.branch:
          const referenceLevel =
            createLevel == GroupLevel.branch ? GroupLevel.brand : GroupLevel.branch;
          this.targetInheritList.unshift(
            this.checkReferenceTarget(target, groupName, referenceLevel)
          );
          break;
      }
    } else {
      const { groupLevel } = this.editBody;
      switch (groupLevel) {
        case GroupLevel.class:
          const { target: branchTarget, branchName } = groupRootInfo[3];
          this.targetInheritList.unshift(
            this.checkReferenceTarget(branchTarget, branchName, GroupLevel.branch)
          );
        // 這邊不中斷（break）;
        case GroupLevel.branch:
          const { target: brandTarget, brandName } = groupRootInfo[2];
          this.targetInheritList.unshift(
            this.checkReferenceTarget(brandTarget, brandName, GroupLevel.brand)
          );
          break;
      }
    }
  }

  /**
   * 確認目標是否有效，無效則回傳預設值
   * @param target {GroupSportTarget}-運動目標
   * @param groupName {string}-群組名稱
   * @param level {GroupLevel}-群組階層
   */
  checkReferenceTarget(target: GroupSportTarget, groupName: string, level: GroupLevel) {
    if (target.name) {
      const { cycle, condition } = target;
      return { groupName, level, cycle, condition };
    }

    return { groupName, level, cycle: DateUnit.week, condition: [] };
  }

  /**
   * 將已編輯運動目標恢復未修改的狀態
   */
  recoverTarget() {
    this.sportTarget = deepCopy(this.originSportsTarget);
  }

  /**
   * 取消rxjs訂閱
   * @author kidin-1091103
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
