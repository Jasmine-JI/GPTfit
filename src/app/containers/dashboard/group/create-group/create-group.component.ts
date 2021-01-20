import {
  Component,
  OnInit,
  ViewEncapsulation,
  HostListener,
  OnDestroy
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
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { MsgDialogComponent } from '../../components/msg-dialog/msg-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { PeopleSelectorWinComponent } from '../../components/people-selector-win/people-selector-win.component';
import * as _ from 'lodash';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { planDatas } from '../desc';
import moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { HashIdService } from '@shared/services/hash-id.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-create-group',
  templateUrl: './create-group.component.html',
  styleUrls: ['./create-group.component.scss', '../group-style.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CreateGroupComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  i18n = {
    teacher: '',
    coach: '',
    leagueAdministrator: '',
    departmentAdministrator: '',
    myGroup: '',
    nickname: '',
    myGym: '',
    activityRecord: '',
    sportReport: ''
  };
  groupId: string;
  token: string;
  groupInfo: any;
  groupImg: string;
  group_id: string;
  groupLevel: number;
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
  isShowCreateForm = false;
  form: FormGroup;
  formTextName = 'groupName';
  formTextareaName = 'groupDesc';
  planName: string;
  role = {
    accessRight: 99,
    userId: null,
    userName: ''
  };
  finalImageLink: string;
  maxFileSize = 10485760; // 10MB
  isUploading = false;
  isEditing = false;
  reloadFileText = '重新上傳';
  chooseFileText = '選擇檔案';
  acceptFileExtensions = ['JPG', 'JPEG', 'GIF', 'PNG'];
  createType = 3; // 1為新建分店， 2為新建教練課，3為新建群組，4為新建品牌，5為新建企業-kidin-1090114
  brandName: string;
  chooseType: number;
  coachType: number;
  chooseLabels = [];
  planDatas = planDatas;
  totalCost: number;
  title: string;
  brandType = null;
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
    private userProfileService: UserProfileService,
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

    // 根據網址判斷欲建立何種群組-kidin-1090114
    if (
      location.pathname.indexOf('/dashboard/system/create-brand-group') > -1
    ) {
      this.createType = 4;
    } else if (
      location.pathname.indexOf('/dashboard/system/create-com-group') > -1
    ) {
      this.createType = 5;
    }

    this.groupId = this.hashIdService.handleGroupIdDecode(
      this.route.snapshot.paramMap.get('groupId')
    );

    this.buildForm(this.createType);
    this.getCreatorInfo();
    this.token = this.utils.getToken() || '';
    const body = {
      token: this.token,
      groupId: this.groupId,
      avatarType: 2
    };

    if (this.createType !== 3 && this.createType !== 4 && this.createType !== 5) {
      this.groupService.fetchGroupListDetail(body).subscribe(res => {
        this.groupInfo = res.info;
        const {
          groupIcon,
          groupId,
          groupName,
          selfJoinStatus,
          brandType
        } = this.groupInfo;

        if (selfJoinStatus) {
          this.joinStatus = selfJoinStatus;
        } else {
          this.joinStatus = 0;
        }

        this.brandName = groupName;
        this.brandType = brandType;
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
  }

  /**
   * 取得創群組者（登入者）的部份資訊
   * @author kidin-1090728
   */
  getCreatorInfo() {
    this.userProfileService.getRxUserProfile().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      if (res['systemAccessRight']) {
        this.role = {
          accessRight: res['systemAccessRight'][0],
          userId: res['userId'],
          userName: res['nickname']
        };

        // 建立分店以及課程群組時，指派建立者為預設管理員。 by Vincent 2019/5/9
        if (+this.createType === 1 || +this.createType === 2) {
          this.chooseLabels.push({ 'groupName': 'GPTFit', 'userName': this.role.userName, 'userId': this.role.userId });
          this.form.patchValue({ groupManager: [ this.role.userId ] });
        }

      }

    });

  }

  getAndInitTranslations() {
    this.translate
      .get([
        'universal_group_setBrandAdministrator',
        'universal_group_setBranchAdministrator',
        'universal_group_setCoach',
        'universal_group_setAeacher',
        'universal_group_setAdministrator',
        'universal_group_teacher',
        'universal_group_coach',
        'universal_group_administrator',
        'universal_group_departmentAdmin',
        'universal_group_myGroup',
        'universal_vocabulary_avatar',
        'universal_userAccount_nickname',
        'universal_privacy_myGym',
        'universal_activityData_activityRecord',
        'universal_activityData_sportReport'
      ])
      .subscribe(translation => {
        switch (this.createType) {
          case 1:
            this.title =
              translation['universal_group_setBranchAdministrator'];
            break;
          case 2:
            if (this.coachType === 2) {
              this.title = translation['universal_group_setCoach'];
            } else {
              this.title = translation['universal_group_setAeacher'];
            }
            break;
          case 3:
            this.title = translation['universal_group_setBrandAdministrator'];
            break;
          default:
            this.title =
              translation['universal_group_setBrandAdministrator'];
        }

        this.i18n = {
          teacher: translation['universal_group_teacher'],
          coach: translation['universal_group_coach'],
          leagueAdministrator: translation['universal_group_administrator'],
          departmentAdministrator: translation['universal_group_departmentAdmin'],
          myGroup: translation['universal_group_myGroup'],
          nickname: `${translation['universal_vocabulary_avatar']
            } ${translation['universal_userAccount_nickname']
          }`,
          myGym: translation['universal_privacy_myGym'],
          activityRecord: translation['universal_activityData_activityRecord'],
          sportReport: translation['universal_activityData_sportReport']
        };

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
    } else if (_type === 4 || _type === 5) {
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
      actionType: _type,
      brandType: this.brandType
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
          if (this.groupLevel === 40) {
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
    // return
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
      image.setAttribute('crossOrigin', 'Anonymous');
      if (this.finalImageLink === undefined || this.finalImageLink === null || this.finalImageLink === '') {
        if (location.hostname === '192.168.1.235') {
          image.src = 'https://app.alatech.com.tw/assets/images/group.jpg';
        } else {
          image.src = `https://${location.hostname}/assets/images/group.jpg`;
        }
      } else {

        if (location.pathname === 'www.gptfit.com') {
          image.src = this.finalImageLink.replace('cloud.alatech.com.tw', 'www.gptfitcom.com');
        } else {
          image.src = this.finalImageLink;
        }

      }

      // 確認建立的brandType-kidin-1090115
      if (this.brandType === null) {
        if (this.chooseType === 4) {
          this.brandType = 1;
        } else if (this.chooseType === 5) {
          this.brandType = 2;
        }
      }

      image.onload = () => {
        const body = {
          token: this.token,
          brandType: this.brandType,
          groupId: this.groupId,
          groupManager,
          levelDesc: groupDesc,
          groupStatus,
          levelIcon: this.utils.imageToDataUri(image, 256, 256) || '',
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
          // 建立分店或分公司
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

              // 創建群組後更新使用者group accessRight
              const refreshBody = {
                token: this.token
              };
              this.userProfileService.refreshUserProfile(refreshBody);
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
          // 建立教練課或部門
          const { branchId, coachLessonName } = value;
          body.levelType = 5;
          body.coachType = this.coachType;
          body.levelName = coachLessonName;
          if (this.coachType === 1) {
            // 一般教練(課)或社團
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
            // 體適能教練(課)或部門
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
          // 建立品牌/企業-kidin-1090114
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
      };
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
      const { isTypeCorrect, errorMsg, link } = file;
      this.finalImageLink = link;
      if (!isTypeCorrect) {
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
        this.planName = this.translate.instant('universal_group_experiencePlan');
        break;
      case 2:
        this.planName = this.translate.instant('universal_group_studioPlan');
        break;
      case 3:
        this.planName = this.translate.instant('universal_group_smePlan');
        break;
      default:
        this.planName = this.translate.instant('universal_group_customPlan');
    }

    this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: 'Message',
        body: this.translate.instant('universal_group_youSelectProgram', {
          'projectName': this.planName
        }),
        confirmText: this.translate.instant('universal_operating_confirm'),
        cancelText: this.translate.instant('universal_operating_cancel'),
        onConfirm: () => {
          this.router.navigateByUrl(
            `/dashboard/group-info/${
              this.hashIdService.handleGroupIdEncode(`0-0-0-0-0-0`)
            }/group-introduction?createType=brand&plan=${
              this.commercePlan
            }&brandType=1`
          );

        }
      }

    });
    
  }

  // 建立企業群組-kidin-109114
  handleShowCreateCom () {
    switch (this.commercePlan) {
      case 1:
        this.planName = this.translate.instant('universal_group_experiencePlan');
        break;
      case 2:
        this.planName = this.translate.instant('universal_group_studioPlan');
        break;
      case 3:
        this.planName = this.translate.instant('universal_group_smePlan');
        break;
      default:
        this.planName = this.translate.instant('universal_group_customPlan');
    }

    this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: 'Message',
        body: this.translate.instant('universal_group_youSelectProgram', {
          'projectName': this.planName
        }),
        confirmText: this.translate.instant('universal_operating_confirm'),
        cancelText: this.translate.instant('universal_operating_cancel'),
        onConfirm: () => {
          this.router.navigateByUrl(
            `/dashboard/group-info/${
              this.hashIdService.handleGroupIdEncode(`0-0-0-0-0-0`)
            }/group-introduction?createType=brand&plan=${
              this.commercePlan
            }&brandType=2`
          );

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
      case 5:
        href = '/dashboard/system/all-group-list';
        break;
      default:
        href = `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(
          this.groupId
        )}/edit`;
    }

    if (+this.brandType === 1) {
      if (this.createType === 1) {
        typeName = this.translate.instant('universal_group_branch');
      } else if (this.createType === 2) {
        typeName = this.translate.instant('universal_group_coachingClass');
      } else if (this.createType === 3) {
        typeName = this.translate.instant('universal_group_group');
      } else if (this.createType === 4) {
        typeName = this.translate.instant('universal_group_brand');
      } else if (this.createType === 5) {
        typeName = this.translate.instant('universal_group_enterprise');
      }
    } else {
      if (this.createType === 1) {
        typeName = this.translate.instant('universal_group_companyBranch');
      } else if (this.createType === 2 && this.coachType === 1) {
        typeName = this.translate.instant('universal_group_generalGroup');
      } else if (this.createType === 2 && this.coachType === 2) {
          typeName = this.translate.instant('universal_group_department');
      } else if (this.createType === 3) {
        typeName = this.translate.instant('universal_group_group');
      } else if (this.createType === 4) {
        typeName = this.translate.instant('universal_group_brand');
      } else if (this.createType === 5) {
        typeName = this.translate.instant('universal_group_enterprise');
      }
    }

    this.dialog.open(MsgDialogComponent, {
      hasBackdrop: true,
      data: {
        title: 'Message',
        body: this.translate.instant('universal_popUpMessage_confirmCancelCreate', {
          deviceName: typeName
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

  handleConfirm(type, _lists) {
    const userIds = _lists.map(_list => _list.userId);
    this.form.patchValue({ groupManager: userIds });
    this.chooseLabels = _lists;
  }

  openSelectorWin(_type: number, e) {
    e.preventDefault();
    this.chooseType = _type;

    const adminLists = _.cloneDeep(this.chooseLabels);
    if (_type !== 3) {
      this.dialog.open(PeopleSelectorWinComponent, {
        hasBackdrop: true,
        data: {
          title: this.title,
          adminLevel: `${_type}`,
          adminLists,
          type: 1,
          onConfirm: this.handleConfirm.bind(this),
          isInnerAdmin:
            _type === 4 || _type === 5 &&
            (this.role.accessRight < 30)
        }
      });
    }
  }

  /**
   * 解除rxjs訂閱
   * @author kidin-1090722
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
