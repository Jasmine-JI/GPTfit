import {
  Component,
  OnInit,
  ViewEncapsulation,
  HostListener
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { UtilsService } from '@shared/services/utils.service';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { UserInfoService } from '../../services/userInfo.service';
import { MsgDialogComponent } from '../../components/msg-dialog/msg-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { PeopleSelectorWinComponent } from '../../components/people-selector-win/people-selector-win.component';
import * as _ from 'lodash';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { planDatas } from '../desc';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { HashIdService } from '@shared/services/hash-id.service';

@Component({
  selector: 'app-create-group',
  templateUrl: './create-group.component.html',
  styleUrls: ['./create-group.component.scss', '../group-style.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CreateGroupComponent implements OnInit {
  groupId: string;
  token: string;
  groupInfo: any;
  groupImg: string;
  group_id: string;
  groupLevel: string;
  groupInfos: any;
  joinStatus = 0;
  subGroupInfo: any;
  brandAdministrators: any;
  subBrandInfo: any;
  subBranchInfo: any;
  subCoachInfo: any;
  branchAdministrators: any;
  coachAdministrators: any;
  remindText = '※不得超過32個字元';
  remindDescText = '※不得超過500個字元';
  inValidText = '欄位為必填';
  textareaMaxLength = 500;
  commercePlan: number;
  isShowCreateBrand = false;
  form: FormGroup;
  formTextName = 'groupName';
  formTextareaName = 'groupDesc';
  planName: string;
  role = {
    isSupervisor: false,
    isSystemDeveloper: false,
    isSystemMaintainer: false,
    isMarketingDeveloper: false,
    isBrandAdministrator: false,
    isBranchAdministrator: false,
    isCoach: false,
    getUserId: 0,
    getUserName: ''
  };
  finalImageLink: string;
  maxFileSize = 10485760; // 10MB
  isUploading = false;
  isEditing = false;
  reloadFileText = '重新上傳';
  chooseFileText = '選擇檔案';
  acceptFileExtensions = ['JPG', 'JPEG', 'GIF', 'PNG'];
  createType = 3; // 1為新建分店， 2為新建教練課，3為新建群組，4為新建品牌
  brandName: string;
  chooseType: number;
  coachType: number;
  chooseLabels = [];
  planDatas = planDatas;
  totalCost: number;
  title: string;
  get groupName() {
    return this.form.get('groupName');
  }
  get groupDesc() {
    return this.form.get('groupDesc');
  }
  get branchName() {
    return this.form.get('branchName');
  }
  get coachLessonName() {
    return this.form.get('coachLessonName');
  }
  get branchId() {
    return this.form.get('branchId');
  }
  get groupManager() {
    return this.form.get('groupManager');
  }
  get commercePlanExpired() {
    return this.form.get('commercePlanExpired');
  }
  get maxBranches() {
    return this.form.get('maxBranches');
  }
  get maxClasses() {
    return this.form.get('maxClasses');
  }
  get maxGroupManagers() {
    return this.form.get('maxGroupManagers');
  }
  get maxGroupMembers() {
    return this.form.get('maxGroupMembers');
  }
  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private utils: UtilsService,
    private router: Router,
    private fb: FormBuilder,
    private userInfoService: UserInfoService,
    public dialog: MatDialog,
    private translate: TranslateService,
    private hashIdService: HashIdService
  ) {}
  @HostListener('dragover', ['$event'])
  public onDragOver(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }
  @HostListener('dragleave', ['$event'])
  public onDragLeave(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }
  @HostListener('drop', ['$event'])
  public onDrop(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }
  ngOnInit() {
    const queryStrings = this.utils.getUrlQueryStrings(location.search);
    const { createType, coachType } = queryStrings;
    if (coachType) {
      this.coachType = +coachType;
    }
    if (createType) {
      this.createType = +createType;
    }
    if (
      location.pathname.indexOf('/dashboard/system/create-brand-group') > -1
    ) {
      this.createType = 4;
    }
    this.groupId = this.hashIdService.handleGroupIdDecode(
      this.route.snapshot.paramMap.get('groupId')
    );
    this.buildForm(this.createType);
    this.userInfoService.getSupervisorStatus().subscribe(res => {
      this.role.isSupervisor = res;
      // console.log('%c this.isSupervisor', 'color: #0ca011', res);
    });
    this.userInfoService.getSystemDeveloperStatus().subscribe(res => {
      this.role.isSystemDeveloper = res;
      // console.log('%c this.isSystemDeveloper', 'color: #0ca011', res);
    });
    this.userInfoService.getSystemMaintainerStatus().subscribe(res => {
      this.role.isSystemMaintainer = res;
      // console.log('%c this.isSystemMaintainer', 'color: #0ca011', res);
    });
    this.userInfoService.getMarketingDeveloperStatus().subscribe(res => {
      this.role.isMarketingDeveloper = res;
      // console.log('%c this.isMarketingDeveloper', 'color: #ccc', res);
    });
    this.userInfoService.getBrandAdministratorStatus().subscribe(res => {
      this.role.isBrandAdministrator = res;
      // console.log('%c this.isBrandAdministrator', 'color: #0ca011', res);
    });
    this.userInfoService.getBranchAdministratorStatus().subscribe(res => {
      this.role.isBranchAdministrator = res;
      // console.log('%c this.isBranchAdministrator', 'color: #0ca011', res);
    });
    this.userInfoService.getCoachStatus().subscribe(res => {
      this.role.isCoach = res;
      // console.log('%c this.isCoach', 'color: #0ca011', res);
    });
    this.userInfoService.getUserId().subscribe(res => {
      this.role.getUserId = res;
      // console.log('%c this.getUserId', 'color: #0ca011', res);
    });
    this.userInfoService.getUserName().subscribe(res => {
      this.role.getUserName = res;
      // console.log('%c this.getUserName', 'color: #0ca011', res);
    });
    this.token = this.utils.getToken();
    const body = {
      token: this.token,
      groupId: this.groupId,
      avatarType: 2
    };
    if (this.createType !== 3 && this.createType !== 4) {
      this.groupService.fetchGroupListDetail(body).subscribe(res => {
        this.groupInfo = res.info;
        const {
          groupIcon,
          groupId,
          groupName,
          selfJoinStatus
        } = this.groupInfo;
        if (selfJoinStatus) {
          this.joinStatus = selfJoinStatus;
        } else {
          this.joinStatus = 0;
        }
        this.brandName = groupName;
        this.groupImg = groupIcon;
        this.finalImageLink = this.groupImg;
        this.group_id = this.utils.displayGroupId(groupId);
        this.groupLevel = this.utils.displayGroupLevel(groupId);
        this.getGroupMemberList(1);
      });
    }
    this.translate.onLangChange.subscribe(() => {
      this.getAndInitTranslations();
    });
    this.getAndInitTranslations();

    //建立分店以及課程群組時，指派建立者為預設管理員。 by Vincent 2019/5/9
    if (this.createType == 1 || this.createType == 2) {
      this.chooseLabels.push({ "groupName": "Alatech", "userName": this.role.getUserName, "userId": this.role.getUserId });
      this.form.patchValue({ groupManager: [ this.role.getUserId ] });
    }
  }
  getAndInitTranslations() {
    this.translate
      .get([
        'Dashboard.Group.setBrandAdministrator',
        'Dashboard.Group.setBranchAdministrator',
        'Dashboard.Group.setCoach',
        'Dashboard.Group.setAeacher',
        'Dashboard.Group.setAdministrator'
      ])
      .subscribe(translation => {
        switch (this.createType) {
          case 1:
            this.title =
              translation['Dashboard.Group.setBranchAdministrator'];
            break;
          case 2:
            if (this.coachType === 2) {
              this.title = translation['Dashboard.Group.setCoach'];
            } else {
              this.title = translation['Dashboard.Group.setAeacher'];
            }
            break;
          case 3:
            this.title = translation['Dashboard.Group.setBrandAdministrator'];
            break;
          default:
            this.title =
              translation['Dashboard.Group.setBrandAdministrator'];
        }
      });
  }
  buildForm(_type: number) {
    if (_type === 1) {
      this.formTextName = 'branchName';
      this.form = this.fb.group({
        branchName: ['', [Validators.required, Validators.maxLength(32)]],
        groupManager: [[], [Validators.required]],
        groupDesc: ['', [Validators.required, Validators.maxLength(500)]],
        groupStatus: 2
      });
    } else if (_type === 2) {
      this.formTextName = 'coachLessonName';
      this.form = this.fb.group({
        branchId: ['', [Validators.required]],
        groupManager: [[], [Validators.required]],
        coachLessonName: ['', [Validators.required, Validators.maxLength(32)]],
        groupDesc: ['', [Validators.required, Validators.maxLength(500)]],
        groupStatus: 2
      });
    } else if (_type === 4) {
      this.form = this.fb.group({
        groupManager: [[], [Validators.required]],
        groupName: ['', [Validators.required, Validators.maxLength(32)]],
        groupDesc: ['', [Validators.required, Validators.maxLength(500)]],
        commercePlanExpired: ['', [Validators.required]],
        maxBranches: [0, [Validators.required]],
        maxClasses: [0, [Validators.required]],
        maxGroupManagers: [0, [Validators.required]],
        maxGroupMembers: [0, [Validators.required]],
        groupStatus: 2
      });
    } else {
      this.form = this.fb.group({
        groupManager: [[''], [Validators.required]],
        groupName: ['', [Validators.required, Validators.maxLength(32)]],
        groupDesc: ['', [Validators.required, Validators.maxLength(500)]],
        groupStatus: 2
      });
    }
  }
  handleActionGroup(_type) {
    const body = {
      groupId: this.groupId,
      actionType: _type
    };
    this.groupService
      .actionGroup(body)
      .subscribe(({ resultCode, info: { selfJoinStatus } }) => {
        if (resultCode === 200) {
          if (_type === 2) {
            this.joinStatus = 0;
          } else {
            this.joinStatus = selfJoinStatus;
          }
        }
      });
  }

  getGroupMemberList(_type) {
    const body = {
      token: this.token,
      groupId: this.groupId,
      groupLevel: '30',
      infoType: _type,
      avatarType: 3
    };
    this.groupService.fetchGroupMemberList(body).subscribe(res => {
      if (res.resultCode === 200) {
        const {
          info: { groupMemberInfo, subGroupInfo }
        } = res;
        if (_type === 1) {
          this.subGroupInfo = subGroupInfo;
          this.subBrandInfo = this.subGroupInfo.brands.map(_brand => {
            return {
              ..._brand,
              groupIcon: _brand.groupIcon
            };
          });
          this.subBranchInfo = this.subGroupInfo.branches.filter(_branch => {
            if (_branch.groupStatus !== 4) {
              return {
                ..._branch,
                groupIcon: _branch.groupIcon
              };
            }
          });
          this.subCoachInfo = this.subGroupInfo.coaches.filter(_coach => {
            if (_coach.groupStatus !== 4) {
              return {
                ..._coach,
                groupIcon: _coach.groupIcon
              };
            }
          });
          if (this.groupLevel === '40') {
            this.subBranchInfo = this.subGroupInfo.branches.filter(_branch => {
              if (_branch.groupId === this.groupId) {
                return _branch;
              }
            });
            this.brandName = this.subBrandInfo[0].groupName;
            this.form.patchValue({
              branchId: this.subBranchInfo[0].groupId
            });
          }
        } else {
          this.groupInfos = groupMemberInfo;
          this.groupInfos = this.groupInfos
            .map(_info => {
              return {
                ..._info,
                memberIcon: _info.memberIcon
              };
            })
            .filter(newInfo => !(typeof newInfo === 'undefined'));
          this.brandAdministrators = this.groupInfos.filter(
            _info => _info.accessRight === '30'
          );
          this.branchAdministrators = this.groupInfos.filter(
            _info => _info.accessRight === '40'
          );
          this.coachAdministrators = this.groupInfos.filter(
            _info => _info.accessRight === '60'
          );
        }
      }
    });
  }
  changeGroupInfo({ index }) {
    if (index === 0) {
      this.getGroupMemberList(1);
    } else if (index === 1) {
      this.getGroupMemberList(2);
    } else if (index === 2) {
      this.getGroupMemberList(3);
    } else {
      this.getGroupMemberList(4);
    }
  }
  manage({ valid, value, submitted }) {
    if (!submitted) {
      // 如果脫離form的判斷
      this.utils.markFormGroupTouched(this.form);
    }
    //return
    if (valid) {
      const {
        groupDesc,
        groupStatus,
        groupManager,
        maxBranches,
        maxClasses,
        maxGroupManagers,
        maxGroupMembers,
        commercePlanExpired
      } = value;
      const image = new Image();
      image.src = this.finalImageLink;
      const body = {
        token: this.token,
        groupId: this.groupId,
        groupManager,
        levelDesc: groupDesc,
        groupStatus,
        levelIcon: this.finalImageLink || '',
        levelIconMid: this.utils.imageToDataUri(image, 128, 128) || '',
        levelIconSmall: this.utils.imageToDataUri(image, 64, 64) || '',
        levelName: '',
        levelType: null,
        coachType: null,
        commercePlan: null,
        groupSetting: null,
        groupManagerSetting: null,
        groupMemberSetting: null,
        commercePlanExpired: '',
        shareAvatarToMember: {
          switch: '1',
          enableAccessRight: [],
          disableAccessRight: []
        },
        shareActivityToMember: {
          switch: '2',
          enableAccessRight: [],
          disableAccessRight: []
        },
        shareReportToMember: {
          switch: '2',
          enableAccessRight: [],
          disableAccessRight: []
        }
      };
      if (this.createType === 1) {
        // 建立分店
        const { branchName } = value;
        body.levelName = branchName;
        body.levelType = 4;
        this.isEditing = true;
        this.groupService.createGroup(body).subscribe(res => {
          this.isEditing = false;
          if (res.resultCode === 200) {
            this.router.navigateByUrl(
              `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(
                this.groupId
              )}/edit`
            );
          }
          if (res.resultCode === 400) {
            this.dialog.open(MessageBoxComponent, {
              hasBackdrop: true,
              data: {
                title: 'message',
                body: res.resultMessage
              }
            });
          }
          if (res.resultCode === 409) {
            this.dialog.open(MsgDialogComponent, {
              hasBackdrop: true,
              data: {
                title: 'Message',
                body: res.resultMessage
              }
            });
          }
        });
      } else if (this.createType === 2) {
        // 建立教練課
        const { branchId, coachLessonName } = value;
        body.levelType = 5;
        body.coachType = this.coachType;
        body.levelName = coachLessonName;
        if (this.coachType === 1) {
          // 一般教練(課)
          body.shareAvatarToMember = {
            switch: '1',
            enableAccessRight: [],
            disableAccessRight: []
          };
          body.shareActivityToMember = {
            switch: '2',
            enableAccessRight: [],
            disableAccessRight: []
          };
          body.shareReportToMember = {
            switch: '2',
            enableAccessRight: [],
            disableAccessRight: []
          };
        } else {
          // 體適能教練(課)
          body.shareAvatarToMember = {
            switch: '1',
            enableAccessRight: [],
            disableAccessRight: []
          };
          body.shareActivityToMember = {
            switch: '3',
            enableAccessRight: ['50'],
            disableAccessRight: []
          };
          body.shareReportToMember = {
            switch: '3',
            enableAccessRight: ['50'],
            disableAccessRight: []
          };
        }

        if (branchId !== this.groupId) {
          body.groupId = branchId;
        }
        this.isEditing = true;
        this.groupService.createGroup(body).subscribe(res => {
          this.isEditing = false;
          if (res.resultCode === 200) {
            this.router.navigateByUrl(
              `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(
                this.groupId
              )}/edit`
            );
          }
          if (res.resultCode === 400) {
            this.dialog.open(MessageBoxComponent, {
              hasBackdrop: true,
              data: {
                title: 'message',
                body: res.resultMessage
              }
            });
          }
          if (res.resultCode === 409) {
            this.dialog.open(MsgDialogComponent, {
              hasBackdrop: true,
              data: {
                title: 'Message',
                body: res.resultMessage
              }
            });
          }
        });
      } else if (this.createType === 3) {
        const { groupName } = value;
        body.levelName = groupName;
        body.levelType = 6;
        body.groupId = '0-0-0-0-0-0';
        this.isEditing = true;
        this.groupService.createGroup(body).subscribe(res => {
          this.isEditing = false;
          if (res.resultCode === 200) {
            this.router.navigateByUrl('/dashboard/my-group-list');
          }
          if (res.resultCode === 400) {
            this.dialog.open(MessageBoxComponent, {
              hasBackdrop: true,
              data: {
                title: 'message',
                body: res.resultMessage
              }
            });
          }
          if (res.resultCode === 409) {
            this.dialog.open(MsgDialogComponent, {
              hasBackdrop: true,
              data: {
                title: 'Message',
                body: res.resultMessage
              }
            });
          }
        });
      } else {
        const { groupName } = value;
        body.levelName = groupName;
        body.levelType = 3;
        body.groupId = '0-0-0-0-0-0';
        body.commercePlan = this.commercePlan;
        body.groupSetting = {
          maxBranches,
          maxClasses,
          maxGeneralGroups: 0
        };
        body.groupManagerSetting = { maxGroupManagers };
        body.groupMemberSetting = { maxGroupMembers };
        body.commercePlanExpired = commercePlanExpired;
        this.isEditing = true;
        this.groupService.createGroup(body).subscribe(res => {
          this.isEditing = false;
          if (res.resultCode === 200) {
            this.router.navigateByUrl('/dashboard/system/all-group-list');
          }
          if (res.resultCode === 400) {
            this.dialog.open(MessageBoxComponent, {
              hasBackdrop: true,
              data: {
                title: 'message',
                body: res.resultMessage
              }
            });
          }
          if (res.resultCode === 409) {
            this.dialog.open(MsgDialogComponent, {
              hasBackdrop: true,
              data: {
                title: 'Message',
                body: res.resultMessage
              }
            });
          }
        });
      }
    }
  }
  public handleChangeTextarea(code): void {
    this.form.patchValue({ groupDesc: code });
  }
  handleExpireTime(e) {
    let date = '';
    switch (e.value) {
      case '1':
        date = moment()
          .add(1, 'month')
          .format('YYYY-MM-DDTHH:mm:ss.000+08:00');
        break;
      case '2':
        date = moment()
          .add(2, 'month')
          .format('YYYY-MM-DDTHH:mm:ss.000+08:00');
        break;
      case '3':
        date = moment()
          .add(3, 'month')
          .format('YYYY-MM-DDTHH:mm:ss.000+08:00');
        break;
      case '6':
        date = moment()
          .add(6, 'month')
          .format('YYYY-MM-DDTHH:mm:ss.000+08:00');
        break;
      default:
        date = moment()
          .add(12, 'month')
          .format('YYYY-MM-DDTHH:mm:ss.000+08:00');
        break;
    }
    if (this.commercePlan !== 1 && this.commercePlan !== 99) {
      this.totalCost = +this.planDatas[this.commercePlan - 1].cost * +e.value;
    }
    this.form.patchValue({ commercePlanExpired: date });
  }
  handleAttachmentChange(file) {
    if (file) {
      const { isSizeCorrect, isTypeCorrect, errorMsg, link } = file;
      this.finalImageLink = link;
      if (!isSizeCorrect || !isTypeCorrect) {
        this.dialog.open(MsgDialogComponent, {
          hasBackdrop: true,
          data: {
            title: 'Message',
            body: errorMsg
          }
        });
      }
    }
  }
  handleShowCreateBrand() {
    switch (this.commercePlan) {
      case 1:
        this.planName = this.translate.instant('Dashboard.System.BrandPlan.experiencePlan');
        break;
      case 2:
        this.planName = this.translate.instant('Dashboard.System.BrandPlan.studioPlan');
        break;
      case 3:
        this.planName = this.translate.instant('Dashboard.System.BrandPlan.smePlan');
        break;
      default:
        this.planName = this.translate.instant('Dashboard.System.BrandPlan.customPlan');
    }
    this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: 'Message',
        body: `您選擇的方案是否為" ${this.planName} "?`,
        confirmText: this.translate.instant('SH.determine'),
        cancelText: this.translate.instant('SH.cancel'),
        onConfirm: () => {
          if (this.commercePlan && this.commercePlan > 0) {
            this.isShowCreateBrand = true;
            if (this.commercePlan < 99) {
              const {
                maxBranches,
                maxClasses,
                maxGroupManagers,
                maxGroupMembers
              } = this.planDatas[this.commercePlan - 1];
              this.form.patchValue({
                maxBranches,
                maxClasses,
                maxGroupManagers,
                maxGroupMembers
              });
            }
          } else {
            this.isShowCreateBrand = false;
          }
        }
      }
    });
  }
  handleCancel(e) {
    e.preventDefault();
    let typeName = '';
    let href = '';
    switch (this.createType) {
      case 3:
        href = '/dashboard/my-group-list';
        break;
      case 4:
        href = '/dashboard/system/all-group-list';
        break;
      default:
        href = `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(
          this.groupId
        )}/edit`;
    }

    if (this.createType === 1) {
      typeName = this.translate.instant('Dashboard.Group.GroupInfo.branch');
    } else if (this.createType === 2) {
      typeName = this.translate.instant('Dashboard.Group.GroupInfo.coachingClass');
    } else if (this.createType === 3) {
      typeName = this.translate.instant('Dashboard.Group.group');
    } else {
      typeName = this.translate.instant('Dashboard.Group.GroupInfo.brand');
    }
    this.dialog.open(MsgDialogComponent, {
      hasBackdrop: true,
      data: {
        title: 'Message',
        body: this.translate.instant('Dashboard.Settings.confirmCancelCreate', {
          target: typeName
        }),
        href
      }
    });
  }
  changePlan(_planIdx) {
    this.commercePlan = _planIdx;
  }
  removeLabel(idx) {
    this.chooseLabels.splice(idx, 1);
    const userIds = this.chooseLabels.map(_label => _label.userId);
    this.form.patchValue({ groupManager: userIds });
  }
  handleConfirm(_lists) {
    const userIds = _lists.map(_list => _list.userId);
    this.form.patchValue({ groupManager: userIds });
    this.chooseLabels = _lists;
  }
  openSelectorWin(_type: number, e) {
    e.preventDefault();
    this.chooseType = _type;

    const adminLists = _.cloneDeep(this.chooseLabels);
    const {
      isSupervisor,
      isSystemDeveloper,
      isSystemMaintainer,
      isMarketingDeveloper
    } = this.role;
    if (_type !== 3) {
      this.dialog.open(PeopleSelectorWinComponent, {
        hasBackdrop: true,
        data: {
          title: this.title,
          adminLevel: `${_type}`,
          adminLists,
          onConfirm: this.handleConfirm.bind(this),
          isInnerAdmin:
            _type === 4 &&
            (isSupervisor ||
              isSystemDeveloper ||
              isSystemMaintainer ||
              isMarketingDeveloper)
        }
      });
    }
  }
}
