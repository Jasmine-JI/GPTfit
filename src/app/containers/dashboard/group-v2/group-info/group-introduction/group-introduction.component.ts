import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent, Subscription, Subject, forkJoin } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { GroupDetailInfo, UserSimpleInfo, EditMode } from '../../../models/group-detail';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { GroupService } from '../../../services/group.service';
import { HashIdService } from '../../../../../shared/services/hash-id.service';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { PeopleSelectorWinComponent } from '../../../components/people-selector-win/people-selector-win.component';
import { planDatas } from '../../../group/desc';
import moment from 'moment';

const errMsg = `Error.<br />Please try again later.`;

@Component({
  selector: 'app-group-introduction',
  templateUrl: './group-introduction.component.html',
  styleUrls: ['./group-introduction.component.scss', '../group-child-page.scss']
})
export class GroupIntroductionComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();
  clickEvent: Subscription;

  /**
   * placeholder用多國語系
   */
  i18n = {
    enterName: '',
    enterDesc: '',
    assignAdmin: ''
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
    isLoading: false
  };

  /**
   * 表單驗證用flag
   */
  formCheck = {
    name: null,
    desc: null
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
    changeStatus: 1
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
      maxGeneralGroups: 0
    },
    groupManagerSetting: {
      maxGroupManagers: null
    },
    groupMemberSetting: {
      maxGroupMembers: null
    },
    commercePlanExpired: '',
    shareAvatarToMember: {
      switch: 1,
      enableAccessRight: [],
      disableAccessRight: []
    },
    shareActivityToMember: {
      switch: 2,
      enableAccessRight: [],
      disableAccessRight: []
    },
    shareReportToMember: {
      switch: 2,
      enableAccessRight: [],
      disableAccessRight: []
    }
  };

  /**
   * 新建群組的管理員名單
   */
  chooseLabels = [];

  /**
   * 建立品牌/企業群組所需相關設定
   */
  createBrandSetting = {
    planName: '',  // 方案名稱
    planDatas: planDatas,  // 群組各方案設定
    totalCost: 0  // 建立群組方案所需的花費
  };

  constructor(
    private groupService: GroupService,
    private utils: UtilsService,
    private hashIdService: HashIdService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getGroupDetail();
    this.getUserProfile();
  }

  /**
   * 取得已儲存的群組詳細資訊和經營資訊
   * @author kidin-1091103
   */
  getGroupDetail() {

    this.groupService.getRxGroupDetail().pipe(
      switchMap(res => this.groupService.getRxCommerceInfo().pipe(
        map(resp => {
          Object.assign(res, {expired: resp.expired});
          Object.assign(res, {commerceStatus: +resp.commerceStatus})
          return res;
        })

      )),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.groupDetail = res;
      this.editBody = {
        token: this.utils.getToken() || '',
        groupName: this.groupDetail.groupName,
        groupId: this.groupDetail.groupId,
        groupLevel: this.utils.displayGroupLevel(this.groupDetail.groupId),
        groupDesc: this.groupDetail.groupDesc,
        groupVideoUrl: this.groupDetail.groupVideoUrl,
        changeStatus: this.groupDetail.groupStatus
      }

    });

  }


  /**
   * 取得已儲存的使用者資訊
   * @author kidin-1091103
   */
  getUserProfile() {
    this.groupService.getUserSimpleInfo().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
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
        this.createBody.brandType = this.groupDetail.brandType;
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
        if (this.userSimpleInfo.accessRight[0] <= 29) {
          this.openCreateMode();
          this.createBody.levelType = 3;
          this.uiFlag.createLevel = 30;
        }

        break;
      case 'branch':
        if (this.userSimpleInfo.accessRight[0] <= 30) {
          this.assignAdmin();
          this.openCreateMode();
          this.createBody.levelType = 4;
          this.uiFlag.createLevel = 40;
        }

        break;
      case 'coach':
      case 'department':
        if (this.userSimpleInfo.accessRight[0] <= 40) {
          this.assignAdmin();
          this.openCreateMode();
          this.createBody.levelType = 5;
          this.uiFlag.createLevel = 60;
          this.createBody.coachType = 2;
          this.createBody.shareActivityToMember.switch = 3;
          this.createBody.shareReportToMember.switch = 3;
        }

        break;
      case 'teacher':
        if (this.userSimpleInfo.accessRight[0] <= 40) {
          this.assignAdmin();
          this.openCreateMode();
          this.createBody.levelType = 5;
          this.uiFlag.createLevel = 60;
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
   * @author kidin-1091106
   */
  openCreateMode() {
    this.openEditMode('create');
    this.createBody.token = this.userSimpleInfo.token;
    this.createBody.groupId = this.groupDetail.groupId;
    this.createBody.brandType = this.groupDetail.brandType;
    this.createBody.groupManager = this.chooseLabels.map(_user => _user.userId);
    this.getTranslate();
    this.listenGlobalClick();
  }

  /**
   * 若創建分店/分公司以下階層群組，則預設創建者為管理員
   * @author kidin-1091109
   */
  assignAdmin() {
    this.chooseLabels.length === 0;
    this.chooseLabels.push({ 'groupName': 'GPTfit', 'userName': this.userSimpleInfo.nickname, 'userId': this.userSimpleInfo.userId });
  }

  /**
   * 待套件載入完成再產生翻譯
   * @author kidin-1091106
   */
  getTranslate() {
    this.translate.get('hollow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.i18n = {
        enterName: `${this.translate.instant('universal_activityData_name')}`,
        enterDesc: `${this.translate.instant('universal_group_introduction')}`,
        assignAdmin: `${this.translate.instant('universal_group_assignAdmin')}`
      }

    })

  }

  /**
   * 開啟編輯或建立群組模式
   * @author kidin1091123
   */
  openEditMode(action: 'edit' | 'create') {
    this.uiFlag.editMode = action;
    this.groupService.setEditMode(action);    
  }

  /**
   * 關閉編輯模式
   * @author kidin1091123
   */
  closeEditMode(action: 'complete' | 'close') {
    if (this.uiFlag.editMode === 'edit') {
      this.uiFlag.editMode = 'close';
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
        `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(this.createBody.groupId)}/group-architecture`
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
      this.listenGlobalClick();
    }

  }

  /**
   * 確認創建群組的表單哪些欄位未輸入
   * @author kidin1091110
   */
  checkCreateInput() {
    if (
      this.formCheck.name
      && this.formCheck.desc
      && this.chooseLabels.length > 0
      && (
        this.createBody.levelType !== 3
        || (this.createBody.levelType === 3 && this.createBody.commercePlanExpired !== '')
      )
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
    if (this.formCheck.name === null && this.formCheck.desc === null && !this.uiFlag.statusChange) {
      this.closeEditMode('complete');
    } else if (this.editBody.groupName !== '' && this.editBody.groupDesc !== '') {
      this.saveEditContent();
    }

  }

  /**
   * 偵測全域點擊事件，以收納"群組狀態"選單
   * @author kidin-20201104
   */
  listenGlobalClick() {
    const clickEvent = fromEvent(document, 'click');
    this.clickEvent = clickEvent.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.uiFlag.openStatusSelector = false;
    });

  }

  /**
   * 取消訂閱全域點擊事件
   * @author kidin-20201104
   */
  cancelListenGlobalClick() {
    this.clickEvent.unsubscribe();
  }

  /**
   * 開啟群組狀態選單
   * @param e {MouseEvent}
   * @author kidin-1091104
   */
  openStatusSelector(e: MouseEvent) {
    e.stopPropagation();
    this.uiFlag.openStatusSelector = !this.uiFlag.openStatusSelector;
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
        isInnerAdmin: this.uiFlag.createLevel === 30 && this.userSimpleInfo.accessRight[0] < 30
      }

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
        this.createBody.levelName = (e as any).target.value;
      } else if (this.uiFlag.editMode === 'edit') {
        this.uiFlag.contentChange = true;
        this.editBody.groupName = (e as any).target.value;
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
    
    this.uiFlag.openStatusSelector = false;
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
        date = moment().add(1, 'month').format('YYYY-MM-DDTHH:mm:ss.000+08:00');
        break;
      case '2':
        date = moment().add(2, 'month').format('YYYY-MM-DDTHH:mm:ss.000+08:00');
        break;
      case '3':
        date = moment().add(3, 'month').format('YYYY-MM-DDTHH:mm:ss.000+08:00');
        break;
      case '6':
        date = moment().add(6, 'month').format('YYYY-MM-DDTHH:mm:ss.000+08:00');
        break;
      default:
        date = moment().add(12, 'month').format('YYYY-MM-DDTHH:mm:ss.000+08:00');
        break;
    }

    this.createBody.commercePlanExpired = date;

    if (this.createBody.commercePlan !== 1 && this.createBody.commercePlan !== 99) {
      this.createBrandSetting.totalCost = +planDatas[this.createBody.commercePlan - 1].cost * +(e as any).value;
    }

  }

  /**
   * 儲存客製方案細部設定
   * @param e {Event}
   * @param formItem {string}-變更的表單類別
   * @author kidin-1091110
   */
  savePlanSetting(e: Event, formItem: 'branch' | 'class' | 'admin' | 'member') {
    const num = (e as any).value,
          numReg = /^\d+$/;
    switch (formItem) {
      case 'branch':
        if (numReg.test(num) && num >= 1 && num <= 1000) {
          this.createBody.groupSetting.maxBranches = num;
        } else {
          this.createBody.groupSetting.maxBranches = 1;
        }
        
        break;
      case 'class':
        if (numReg.test(num) && num >= 1 && num <= 50000) {
          this.createBody.groupSetting.maxClasses = num;
        } else {
          this.createBody.groupSetting.maxClasses = 2;
        }
        
        break;
      case 'admin':
        if (numReg.test(num) && num >= 1 && num <= 100000) {
          this.createBody.groupManagerSetting.maxGroupManagers = num;
        } else {
          this.createBody.groupManagerSetting.maxGroupManagers = 4;
        }
        
        break;
      case 'member':
        if (numReg.test(num) && num >= 1 && num <= 1000000) {
          this.createBody.groupMemberSetting.maxGroupMembers = num;
        } else {
          this.createBody.groupMemberSetting.maxGroupMembers = 20;
        }
        
        break;
    }

  }

    /**
   * 儲存建立群組的內容
   * @author kidin-1091106
   */
  saveCreateContent() {
    this.groupService.createGroup(this.createBody).subscribe(res => {

      if (res.resultCode !== 200) {
        console.log(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
        this.utils.openAlert(errMsg);
      } else {
        this.groupService.saveNewGroupId(res.info.newGroupId);
        this.closeEditMode('complete');
      }

    });

  }

  /**
   * 儲存編輯內容
   * @author kidin-1091103
   */
  saveEditContent() {
    let eidtGroupBody = this.utils.deepCopy(this.editBody),
        changeGroupStatusBody = {
          token: this.editBody.token,
          groupLevel: this.editBody.groupLevel,
          groupId: this.editBody.groupId,
          changeStatus: this.editBody.changeStatus
        };

    delete eidtGroupBody.changeStatus;

    if (this.uiFlag.contentChange && !this.uiFlag.statusChange) {
      this.sendEditGroupReq(eidtGroupBody);
    } else if (this.uiFlag.statusChange && !this.uiFlag.contentChange) {
      this.sendchangeGroupStatusReq(changeGroupStatusBody);
    } else if (this.uiFlag.statusChange && this.uiFlag.contentChange) {
      this.sendCombinedReq(eidtGroupBody, changeGroupStatusBody);
    } else {
      this.closeEditMode('complete');
      this.cancelListenGlobalClick();
    }

  }

  /**
   * 送出api 1105 的request並關閉編輯模式
   * @param body {any}-api 1105 的request body
   * @author kidin-1091104
   */
  sendEditGroupReq(body: any) {
    this.uiFlag.isLoading = true;
    this.groupService.editGroup(body).subscribe(res => {
      if (res.resultCode === 200) {
        this.initPage();
      } else {
        console.log(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
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
    this.groupService.changeGroupStatus(body).subscribe(res => {
      if (res.resultCode === 200) {
        this.initPage();
        this.refreshAllLevelGroupData();
      } else {
        console.log(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
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
      this.groupService.changeGroupStatus(changeBody)
    ]).subscribe(res => {
      if (res[0].resultCode === 200 && res[1].resultCode === 200) {
        this.initPage();
        this.refreshAllLevelGroupData();
      } else {
        console.log(`${res[0].resultCode}: Api-${res[0].apiCode} ${res[0].resultMessage}`);
        console.log(`${res[1].resultCode}: Api-${res[1].apiCode} ${res[1].resultMessage}`);
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
      infoType: 1
    }

    this.groupService.fetchGroupMemberList(body).subscribe(res => {
      if (res.resultCode !== 200) {
        this.utils.openAlert(errMsg);
        console.log(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
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
    this.cancelListenGlobalClick();
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
   * 取消rxjs訂閱
   * @author kidin-1091103
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}