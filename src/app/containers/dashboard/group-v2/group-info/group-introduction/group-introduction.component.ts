import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent, Subscription, Subject, forkJoin, merge } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { UserSimpleInfo, EditMode, GroupLevel } from '../../../models/group-detail';
import {
  HashIdService,
  AuthService,
  Api11xxService,
  HintDialogService,
} from '../../../../../core/services';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { PeopleSelectorWinComponent } from '../../../components/people-selector-win/people-selector-win.component';
import { planDatas } from '../../../group/desc';
import dayjs from 'dayjs';
import { deepCopy, displayGroupLevel } from '../../../../../core/utils';
import { SportsTarget } from '../../../../../shared/classes/sports-target';
import { TargetConditionMap } from '../../../../../core/models/api/api-common';
import { BenefitTimeStartZone, DateUnit, QueryString } from '../../../../../core/enums/common';
import { ProfessionalService } from '../../../../professional/services/professional.service';
import { formTest } from '../../../../../core/models/regex';
import { GroupDetail } from '../../../../../core/models/api/api-11xx';
import { appPath } from '../../../../../app-path.const';
import { GroupLevelNamePipe } from '../../../../../core/pipes/group-level-name.pipe';
import { GroupStatusPipe } from '../../../../../core/pipes/group-status.pipe';
import { LineBreakPipe } from '../../../../../core/pipes/line-break.pipe';
import { ReferenceHrZonePipe } from '../../../../../core/pipes/reference-hr-zone.pipe';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { SportTargetSettingComponent } from '../../../../../components/sport-target-setting/sport-target-setting.component';
import { FeatureNounTipsComponent } from '../../../../../components/feature-noun-tips/feature-noun-tips.component';
import { NgIf, NgTemplateOutlet, NgFor, DecimalPipe } from '@angular/common';

const errMsg = `Error.<br />Please try again later.`;

@Component({
  selector: 'app-group-introduction',
  templateUrl: './group-introduction.component.html',
  styleUrls: ['./group-introduction.component.scss', '../group-child-page.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgTemplateOutlet,
    FeatureNounTipsComponent,
    NgFor,
    SportTargetSettingComponent,
    MatButtonToggleModule,
    DecimalPipe,
    TranslateModule,
    ReferenceHrZonePipe,
    LineBreakPipe,
    GroupStatusPipe,
    GroupLevelNamePipe,
  ],
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
    showBenefitTimeList: false,
  };

  /**
   * 表單驗證用flag
   */
  formCheck = {
    name: <boolean | null>null,
    desc: <boolean | null>null,
  };

  /**
   * 使用者個人資訊（含權限）
   */
  userSimpleInfo: UserSimpleInfo;

  /**
   * 頁面主要顯示的內容
   */
  groupDetail: GroupDetail;

  /**
   * 編輯完成送出api 1105 的 request body
   */
  editBody = {
    token: '',
    groupLevel: <GroupLevel | null>null,
    groupId: '',
    groupName: '',
    groupDesc: '',
    groupVideoUrl: '',
    changeStatus: 1,
    customField: {
      activityTimeHRZ: BenefitTimeStartZone.zone2,
    },
  };

  /**
   * 編輯完成送出api 1109 的 request body
   */
  createBody = {
    token: '',
    brandType: <number | null>null,
    groupId: '',
    groupStatus: 2,
    groupManager: <Array<any>>[],
    levelName: '',
    levelDesc: '',
    levelType: 5,
    coachType: <number | null>null,
    commercePlan: <number | null>null,
    groupSetting: {
      maxBranches: 1,
      maxClasses: 2,
      maxGeneralGroups: 0,
    },
    groupManagerSetting: {
      maxGroupManagers: <number | null>null,
    },
    groupMemberSetting: {
      maxGroupMembers: <number | null>null,
    },
    groupAllMemberSetting: {
      maxAllGroupMembers: <number | null>null,
    },
    commercePlanExpired: '',
    shareAvatarToMember: {
      switch: 1,
      enableAccessRight: <Array<any>>[],
      disableAccessRight: <Array<any>>[],
    },
    shareActivityToMember: {
      switch: 2,
      enableAccessRight: <Array<any>>[],
      disableAccessRight: <Array<any>>[],
    },
    shareReportToMember: {
      switch: 2,
      enableAccessRight: <Array<any>>[],
      disableAccessRight: <Array<any>>[],
    },
  };

  /**
   * 新建群組的管理員名單
   */
  chooseLabels: Array<any> = [];

  /**
   * 建立品牌/企業群組所需相關設定
   */
  createBrandSetting = {
    planName: '', // 方案名稱
    planDatas: planDatas, // 群組各方案設定
    totalCost: 0, // 建立群組方案所需的花費
  };

  /**
   * 群組運動目標
   */
  sportsTarget: SportsTarget;

  /**
   * 目標條件
   */
  cycleCondition = {
    day: <TargetConditionMap | null>null,
    week: <TargetConditionMap | null>null,
    month: <TargetConditionMap | null>null,
    season: <TargetConditionMap | null>null,
    year: <TargetConditionMap | null>null,
  };

  /**
   * 可繼承的目標清單
   */
  targetInheritList: any = [];

  readonly DateUnit = DateUnit;
  readonly GroupLevel = GroupLevel;
  readonly BenefitTimeStartZone = BenefitTimeStartZone;

  constructor(
    private api11xxService: Api11xxService,
    private hintDialogService: HintDialogService,
    private hashIdService: HashIdService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private router: Router,
    private authService: AuthService,
    private professionalService: ProfessionalService
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
    this.professionalService
      .getRxGroupDetail()
      .pipe(
        switchMap((res) =>
          this.professionalService.getRxCommerceInfo().pipe(
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
        const { groupName, groupId, groupDesc, groupVideoUrl, groupStatus, customField } = res;
        this.editBody = {
          token: this.authService.token,
          groupName,
          groupId,
          groupLevel: +displayGroupLevel(groupId) as GroupLevel,
          groupDesc,
          groupVideoUrl,
          changeStatus: groupStatus,
          customField: {
            activityTimeHRZ: customField?.activityTimeHRZ,
          },
        };

        this.handleSportsTarget();
      });
  }

  /**
   * 取得運動目標，並將條件另外儲存
   * @param reference {GroupLevel | null}-繼承目標的群組階層
   */
  handleSportsTarget(reference: GroupLevel | null = null) {
    this.sportsTarget = reference
      ? new SportsTarget(this.professionalService.getReferenceTarget(this.groupDetail, reference))
      : this.professionalService.getSportsTarget(this.groupDetail);
    this.saveAllCondition();
  }

  /**
   * 將條件另外儲存
   */
  saveAllCondition() {
    this.cycleCondition = {
      day: this.sportsTarget.getArrangeCondition(DateUnit.day),
      week: this.sportsTarget.getArrangeCondition(DateUnit.week),
      month: this.sportsTarget.getArrangeCondition(DateUnit.month),
      season: this.sportsTarget.getArrangeCondition(DateUnit.season),
      year: this.sportsTarget.getArrangeCondition(DateUnit.year),
    };
  }

  /**
   * 取得已儲存的使用者資訊
   * @author kidin-1091103
   */
  getUserProfile() {
    this.professionalService
      .getUserSimpleInfo()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.userSimpleInfo = res;
        this.checkQueryString(location.search.slice(1, location.search.length));
      });
  }

  /**
   * 確認url的query string，判斷是否開啟新增群組模式
   */
  checkQueryString(query: string) {
    const queryArr = query.split('&');
    for (let i = 0, queryLength = queryArr.length; i < queryLength; i++) {
      if (queryArr[i].indexOf(QueryString.createType) > -1) {
        this.checkCreateMode(queryArr[i].split('=')[1]);
      } else if (queryArr[i].indexOf(QueryString.plan) > -1) {
        this.saveBrandPlan(+queryArr[i].split('=')[1]);
      } else if (queryArr[i].indexOf(QueryString.brandType) > -1) {
        this.createBody.brandType = +queryArr[i].split('=')[1];
      }
    }
  }

  /**
   * 根據權限和群組類別開啟建立群組模式
   * @param type {string}-欲新建的群組type
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
      this.createBody.groupManager = this.chooseLabels.map((_user: any) => _user.userId);
      this.setTargetReference(level === GroupLevel.branch ? GroupLevel.brand : GroupLevel.branch);
    }

    this.getTranslate();
    this.listenPluralEvent();
  }

  /**
   * 若創建分店/分公司以下階層群組，則預設創建者為管理員
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
   */
  openEditMode(action: 'edit' | 'create') {
    this.uiFlag.editMode = action;
    this.getTargetInheritList();
    this.professionalService.setEditMode(action);
  }

  /**
   * 關閉編輯模式
   */
  closeEditMode(action: 'complete' | 'close') {
    if (this.uiFlag.editMode === 'edit') {
      this.uiFlag.editMode = 'close';
      this.handleSportsTarget();
      this.professionalService.setEditMode(action);
    } else if (this.uiFlag.editMode === 'create' && action !== 'complete') {
      this.cancelCreateMode();
    } else if (this.uiFlag.editMode === 'create' && action === 'complete') {
      this.professionalService.setEditMode(action);
      this.uiFlag.editMode = 'close';
    }
  }

  /**
   * 取消新建群組
   */
  cancelCreateMode() {
    const {
      dashboard,
      professional: { groupDetail },
      adminManage,
    } = appPath;
    this.uiFlag.editMode = 'close';
    this.professionalService.setEditMode('close');
    if (this.createBody.levelType !== 3) {
      const hashGroupId = this.hashIdService.handleGroupIdEncode(this.createBody.groupId);
      this.router.navigateByUrl(
        `/${dashboard.home}/${groupDetail.home}/${hashGroupId}/${groupDetail.groupArchitecture}`
      );
    } else {
      const childPath =
        this.createBody.brandType === 1 ? adminManage.createBrandGroup : adminManage.createComGroup;
      const url = `/${dashboard.home}/${adminManage.home}/${childPath}`;
      this.router.navigateByUrl(url);
    }
  }

  /**
   * 開啟編輯模式或送出request並關閉編輯模式
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
   */
  listenPluralEvent() {
    const element = document.querySelector('.main__container') as Element;
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
   */
  cancelListenPluralEvent() {
    if (this.pluralEvent) this.pluralEvent.unsubscribe();
  }

  /**
   * 將所有已顯示清單收合
   */
  foldAllList() {
    this.uiFlag.openStatusSelector = false;
    this.uiFlag.showInheritList = false;
    this.uiFlag.showBenefitTimeList = false;
  }

  /**
   * 開啟群組狀態選單
   * @param e {MouseEvent}
   */
  toggleStatusSelector(e: MouseEvent) {
    e.stopPropagation();
    const { openStatusSelector } = this.uiFlag;
    openStatusSelector ? this.closeStatusSelector() : this.openStatusSelector();
  }

  /**
   * 顯示群組狀態清單
   */
  openStatusSelector() {
    this.foldAllList();
    this.uiFlag.openStatusSelector = true;
    this.listenPluralEvent();
  }

  /**
   * 顯示群組狀態清單
   */
  closeStatusSelector() {
    this.uiFlag.openStatusSelector = false;
    this.cancelListenPluralEvent();
  }

  /**
   * 移除所選擇的管理員
   * @param idx {number}-所選的管理員序
   */
  removeLabel(idx: number) {
    this.chooseLabels.splice(idx, 1);
  }

  /**
   * 選擇完管理員並點擊確認後異動管理員名單
   * @param type {number}-選單類別
   * @param _lists {Array<Object>}-指派的管理員清單
   */
  handleConfirm(type: number, _lists: Array<any>) {
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
    const {
      uiFlag: { editMode },
      editBody,
      createBody,
    } = this;
    const { groupId } = editMode === 'edit' ? editBody : createBody;
    this.dialog.open(PeopleSelectorWinComponent, {
      hasBackdrop: true,
      data: {
        title: this.i18n.assignAdmin,
        adminLevel: `${_type}`,
        adminLists,
        type: 1,
        groupId,
        onConfirm: this.handleConfirm.bind(this),
        isInnerAdmin: this.uiFlag.createLevel === 30 && this.userSimpleInfo.accessRight < 30,
      },
    });
  }

  /**
   * 儲存群組名稱
   * @param e {Event}
   */
  saveGroupName(e: Event) {
    const name = (e as any).target.value.trim();
    if (formTest.groupName.test(name)) {
      this.formCheck.name = true;

      if (this.uiFlag.editMode === 'create') {
        this.createBody.levelName = name;
      } else if (this.uiFlag.editMode === 'edit') {
        this.uiFlag.contentChange = true;
        this.editBody.groupName = name;
      }
    } else {
      this.formCheck.name = false;
    }
  }

  /**
   * 儲存群組介紹
   * @param e {Event}
   */
  saveGroupDesc(e: Event) {
    const desc = (e as any).target.value.trim();
    if (desc.length > 0) {
      this.formCheck.desc = true;

      if (this.uiFlag.editMode === 'create') {
        this.createBody.levelDesc = desc;
      } else if (this.uiFlag.editMode === 'edit') {
        this.uiFlag.contentChange = true;
        this.editBody.groupDesc = desc;
      }
    } else {
      this.formCheck.desc = false;
    }
  }

  /**
   * 儲存課程直播連結
   * @param e {Event}
   */
  saveVedioUrl(e: Event) {
    this.uiFlag.contentChange = true;
    this.editBody.groupVideoUrl = (e as any).target.value;
  }

  /**
   * 編輯群組加入狀態
   * @param e {MouseEvent}
   * @param status {number}-group join status
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
      this.createBody.groupAllMemberSetting.maxAllGroupMembers =
        planDatas[plan - 1].allNotRepeatingMember;
    } else {
      // 客製群組暫時預設同中小企業方案
      this.createBody.groupSetting.maxBranches = planDatas[2].maxBranches;
      this.createBody.groupSetting.maxClasses = planDatas[2].maxClasses;
      this.createBody.groupManagerSetting.maxGroupManagers = planDatas[2].maxGroupManagers;
      this.createBody.groupMemberSetting.maxGroupMembers = planDatas[2].maxGroupMembers;
      this.createBody.groupAllMemberSetting.maxAllGroupMembers = planDatas[2].allNotRepeatingMember;
    }
  }

  /**
   * 儲存使用者點擊的方案時間
   * @param e {Event}
   */
  saveExpireTime(e: Event) {
    const diff = +(e as any).value;
    const date = dayjs().add(diff, 'month').format('YYYY-MM-DDTHH:mm:ss.000+08:00');
    const { commercePlan } = this.createBody;
    this.createBody.commercePlanExpired = date;
    if (commercePlan && commercePlan !== 1 && commercePlan !== 99) {
      const { cost } = planDatas[commercePlan - 1];
      this.createBrandSetting.totalCost = +(cost as number) * diff;
    }
  }

  /**
   * 儲存客製方案細部設定
   * @param e {Event}
   * @param formItem {string}-變更的表單類別
   */
  savePlanSetting(e: Event, formItem: 'branch' | 'class' | 'admin' | 'member') {
    const num = (e as any).target.value;
    const numReg = /\d+/;
    const { maxBranches, maxClasses, maxGroupManagers, allNotRepeatingMember } = planDatas[3];
    switch (formItem) {
      case 'branch':
        if (numReg.test(num) && num >= 1 && num <= maxBranches) {
          this.createBody.groupSetting.maxBranches = +num;
        } else {
          this.createBody.groupSetting.maxBranches = maxBranches;
        }

        break;
      case 'class':
        if (numReg.test(num) && num >= 1 && num <= maxClasses) {
          this.createBody.groupSetting.maxClasses = +num;
        } else {
          this.createBody.groupSetting.maxClasses = maxClasses;
        }

        break;
      case 'admin':
        if (numReg.test(num) && num >= 1 && num <= maxGroupManagers) {
          this.createBody.groupManagerSetting.maxGroupManagers = +num;
        } else {
          this.createBody.groupManagerSetting.maxGroupManagers = maxGroupManagers;
        }

        break;
      case 'member':
        if (numReg.test(num) && num >= 1 && num <= 1000000) {
          this.createBody.groupAllMemberSetting.maxAllGroupMembers = +num;
        } else {
          this.createBody.groupAllMemberSetting.maxAllGroupMembers = allNotRepeatingMember;
        }

        break;
    }
  }

  /**
   * 儲存建立群組的內容
   */
  saveCreateContent() {
    this.uiFlag.isLoading = true;
    const target = this.sportsTarget.getReductionTarget();
    Object.assign(this.createBody, { target });
    this.api11xxService.fetchCreateGroup(this.createBody).subscribe((res) => {
      const { resultCode } = res;
      if (resultCode !== 200) {
        console.error(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
        let msg: string;
        switch (resultCode) {
          case 409:
            msg = `群組名稱重複，請更換名稱`;
            this.hintDialogService.openAlert(msg);
            break;
          default:
            msg = `Error.<br />Please check Plans status or try again later.`;
            this.hintDialogService.openAlert(msg);
            break;
        }
      } else {
        this.professionalService.saveNewGroupId(res.info.newGroupId);
        this.closeEditMode('complete');
      }

      this.uiFlag.isLoading = false;
    });
  }

  /**
   * 儲存編輯內容
   */
  saveEditContent() {
    const { editBody, sportsTarget } = this;
    const editGroupBody = deepCopy(editBody);
    if (sportsTarget.reference)
      Object.assign(editGroupBody, { target: sportsTarget.getReductionTarget() });
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
   */
  sendEditGroupReq(body: any) {
    this.uiFlag.isLoading = true;
    this.api11xxService.fetchEditGroup(body).subscribe((res) => {
      if (res.resultCode === 200) {
        this.initPage();
      } else {
        console.error(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
        this.hintDialogService.openAlert(errMsg);
      }

      this.uiFlag.isLoading = false;
    });
  }

  /**
   * 送出api 1107 的request並關閉編輯模式
   * @param body {any}-api 1107 的request body
   */
  sendchangeGroupStatusReq(body: any) {
    this.uiFlag.isLoading = true;
    this.api11xxService.fetchChangeGroupStatus(body).subscribe((res) => {
      if (res.resultCode === 200) {
        this.initPage();
        this.refreshAllLevelGroupData();
      } else {
        console.error(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
        this.hintDialogService.openAlert(errMsg);
      }

      this.uiFlag.isLoading = false;
    });
  }

  /**
   * 送出api 1105 和 api 1107 的request並關閉編輯模式
   * @param body {any}-api 1105 的request body
   */
  sendCombinedReq(editBody: any, changeBody: any) {
    this.uiFlag.isLoading = true;
    forkJoin([
      this.api11xxService.fetchEditGroup(editBody),
      this.api11xxService.fetchChangeGroupStatus(changeBody),
    ]).subscribe((res) => {
      if (res[0].resultCode === 200 && res[1].resultCode === 200) {
        this.initPage();
        this.refreshAllLevelGroupData();
      } else {
        console.error(`${res[0].resultCode}: Api-${res[0].apiCode} ${res[0].resultMessage}`);
        console.error(`${res[1].resultCode}: Api-${res[1].apiCode} ${res[1].resultMessage}`);
        this.hintDialogService.openAlert(errMsg);
      }

      this.uiFlag.isLoading = false;
    });
  }

  /**
   * 儲存所有階層群組資訊
   */
  refreshAllLevelGroupData() {
    const body = {
      token: this.editBody.token,
      avatarType: 3,
      groupId: this.editBody.groupId,
      groupLevel: this.editBody.groupLevel,
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
   * 更新群組頁面
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
   */
  refreshGroupDetail() {
    const body = {
      token: this.editBody.token,
      groupId: this.editBody.groupId,
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
   * 轉導至使用者點選的父群組
   * @param groupId {string}-父群組id
   */
  navigateParentsGroup(groupId: string) {
    const {
      dashboard,
      professional: { groupDetail },
    } = appPath;
    const hashGroupId = this.hashIdService.handleGroupIdEncode(groupId);
    this.closeEditMode('close');
    this.router.navigateByUrl(
      `/${dashboard.home}/${groupDetail.home}/${hashGroupId}/${groupDetail.introduction}`
    );
  }

  /**
   * 展開/收合套用目標清單
   * @param e {MouseEvent}
   */
  toggleInheritList(e: MouseEvent) {
    e.stopPropagation();
    const { showInheritList } = this.uiFlag;
    showInheritList ? this.foldInheritList() : this.unfoldInheritList();
  }

  /**
   * 顯示套用清單
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
   */
  setTargetReference(referenceLevel: GroupLevel) {
    this.handleSportsTarget(referenceLevel);
    this.sportsTarget.reference = referenceLevel;
    this.foldInheritList();
    this.uiFlag.contentChange = true;
  }

  /**
   * 取得可選擇的繼承清單
   */
  getTargetInheritList() {
    this.targetInheritList = [];
    const { editMode, createLevel } = this.uiFlag;
    const [, , brandInfo, branchInfo] = this.groupDetail.groupRootInfo;
    const brandSimpleInfo = { groupName: brandInfo?.brandName, level: GroupLevel.brand };
    const branchSimpleInfo = { groupName: branchInfo?.branchName, level: GroupLevel.branch };
    const groupLevel = editMode === 'create' ? createLevel : this.editBody.groupLevel;
    switch (groupLevel) {
      case GroupLevel.branch:
        this.targetInheritList = [brandSimpleInfo];
        break;
      case GroupLevel.class:
        this.targetInheritList = [brandSimpleInfo, branchSimpleInfo];
        break;
      default:
        break;
    }
  }

  /**
   * 變更指定日期單位的目標條件
   * @param contentMap {TargetConditionMap}-條件Map物件
   * @param cycle {DateUnit}-日期單位
   */
  changeCondition(contentMap: TargetConditionMap, cycle: DateUnit) {
    const { groupId } = this.groupDetail;
    this.sportsTarget.changeAllCondition(cycle, contentMap);
    this.sportsTarget.reference = +displayGroupLevel(groupId) as GroupLevel;
    this.uiFlag.contentChange = true;
  }

  /**
   * 顯示效益時間選單與否
   * @param e {MouseEvent}
   */
  toggleBenefitTimeList(e: MouseEvent) {
    e.stopPropagation();
    const { showBenefitTimeList, editMode } = this.uiFlag;
    if (editMode !== 'close')
      showBenefitTimeList ? this.closeBenefitTimeList() : this.openBenefitTimeList();
  }

  /**
   * 顯示效益時間設定區間選單
   */
  openBenefitTimeList() {
    this.foldAllList();
    this.uiFlag.showBenefitTimeList = true;
    this.listenPluralEvent();
  }

  /**
   * 隱藏效益時間設定區間選單
   */
  closeBenefitTimeList() {
    this.uiFlag.showBenefitTimeList = false;
    this.cancelListenPluralEvent();
  }

  /**
   * 變更效益時間起始計算的心率區間
   * @param zone {BenefitTimeStartZone}-起始心率區間
   */
  changeBenefitTimeStartZone(zone: BenefitTimeStartZone) {
    const { activityTimeHRZ } = this.groupDetail.customField;
    this.editBody.customField.activityTimeHRZ = zone;
    if (activityTimeHRZ !== zone) this.uiFlag.contentChange = true;
    this.cancelListenPluralEvent();
  }

  /**
   * 取消rxjs訂閱
   */
  ngOnDestroy() {
    this.cancelListenPluralEvent();
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
