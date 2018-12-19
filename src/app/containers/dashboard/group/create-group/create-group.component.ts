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
import { HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';
import { UserInfoService } from '../../services/userInfo.service';
import { MsgDialogComponent } from '../../components/msg-dialog/msg-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { PeopleSelectorWinComponent } from '../../components/people-selector-win/people-selector-win.component';
import * as _ from 'lodash';
import { GlobalEventsManager } from '@shared/global-events-manager';

@Component({
  selector: 'app-create-group',
  templateUrl: './create-group.component.html',
  styleUrls: ['./create-group.component.scss', '../group-style.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CreateGroupComponent implements OnInit, OnDestroy {
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
  form: FormGroup;
  formTextName = 'groupName';
  formTextareaName = 'groupDesc';
  role = {
    isSupervisor: false,
    isSystemDeveloper: false,
    isSystemMaintainer: false,
    isBrandAdministrator: false,
    isBranchAdministrator: false,
    isCoach: false
  };
  finalImageLink: string;
  maxFileSize = 524288;
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
  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private utils: UtilsService,
    private router: Router,
    private fb: FormBuilder,
    private userInfoService: UserInfoService,
    public dialog: MatDialog,
    private globalEventsManager: GlobalEventsManager
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
    this.globalEventsManager.setFooterRWD(2); // 為了讓footer長高85px
    const queryStrings = this.utils.getUrlQueryStrings(location.search);
    const { createType, coachType } = queryStrings;
    if (coachType) {
      this.coachType = +coachType;
    }
    if (createType) {
      this.createType = +createType;
    }
    if (location.pathname.indexOf('/dashboard/system/create-brand-group') > -1) {
      this.createType = 4;
    }
    this.groupId = this.route.snapshot.paramMap.get('groupId');

    this.buildForm(this.createType);
    this.userInfoService.getSupervisorStatus().subscribe(res => {
      this.role.isSupervisor = res;
      console.log('%c this.isSupervisor', 'color: #0ca011', res);
    });
    this.userInfoService.getSystemDeveloperStatus().subscribe(res => {
      this.role.isSystemDeveloper = res;
      console.log('%c this.isSystemDeveloper', 'color: #0ca011', res);
    });
    this.userInfoService.getSystemMaintainerStatus().subscribe(res => {
      this.role.isSystemMaintainer = res;
      console.log('%c this.isSystemMaintainer', 'color: #0ca011', res);
    });
    this.userInfoService.getBrandAdministratorStatus().subscribe(res => {
      this.role.isBrandAdministrator = res;
      console.log('%c this.isBrandAdministrator', 'color: #0ca011', res);
    });
    this.userInfoService.getBranchAdministratorStatus().subscribe(res => {
      this.role.isBranchAdministrator = res;
      console.log('%c this.isBranchAdministrator', 'color: #0ca011', res);
    });
    this.userInfoService.getCoachStatus().subscribe(res => {
      this.role.isCoach = res;
      console.log('%c this.isCoach', 'color: #0ca011', res);
    });
    this.token = this.utils.getToken();
    const body = {
      token: this.token,
      groupId: this.groupId
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
        this.groupImg = this.utils.buildBase64ImgString(groupIcon);
        this.finalImageLink = this.groupImg;
        this.group_id = this.utils.displayGroupId(groupId);
        this.groupLevel = this.utils.displayGroupLevel(groupId);
      });
      this.getGroupMemberList(1);
    }
  }
  ngOnDestroy() {
    this.globalEventsManager.setFooterRWD(0); // 為了讓footer自己變回去預設值
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
      infoType: _type
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
              groupIcon: this.utils.buildBase64ImgString(_brand.groupIcon)
            };
          });
          this.subBranchInfo = this.subGroupInfo.branches.filter(_branch => {
            if (_branch.groupStatus !== 4) {
              return {
                ..._branch,
                groupIcon: this.utils.buildBase64ImgString(_branch.groupIcon)
              };
            }
          });
          this.subCoachInfo = this.subGroupInfo.coaches.filter(_coach => {
            if (_coach.groupStatus !== 4) {
              return {
                ..._coach,
                groupIcon: this.utils.buildBase64ImgString(_coach.groupIcon)
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
                memberIcon: this.utils.buildBase64ImgString(_info.memberIcon)
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
    if (valid) {
      const { groupDesc, groupStatus, groupManager } = value;
      const body = {
        token: this.token,
        groupId: this.groupId,
        groupManager,
        levelDesc: groupDesc,
        groupStatus,
        levelIcon: this.finalImageLink || '',
        levelName: '',
        levelType: null,
        coachType: null
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
              `/dashboard/group-info/${this.groupId}/edit`
            );
          }
        });
      } else if (this.createType === 2) {
        // 建立教練課
        const { branchId, coachLessonName } = value;
        body.levelType = 5;
        body.coachType = this.coachType;
        body.levelName = coachLessonName;
        if (branchId !== this.groupId) {
          body.groupId = branchId;
        }
        this.isEditing = true;
        this.groupService.createGroup(body).subscribe(res => {
          this.isEditing = false;
          if (res.resultCode === 200) {
            this.router.navigateByUrl(
              `/dashboard/group-info/${this.groupId}/edit`
            );
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
        });
      } else {
        const { groupName } = value;
        body.levelName = groupName;
        body.levelType = 3;
        body.groupId = '0-0-0-0-0-0';
        this.isEditing = true;
        this.groupService.createGroup(body).subscribe(res => {
          this.isEditing = false;
          if (res.resultCode === 200) {
            this.router.navigateByUrl('/dashboard/system/all-group-list');
          }
        });
      }
    }
  }
  public handleChangeTextarea(code): void {
    this.form.patchValue({ groupDesc: code });
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
        href = `/dashboard/group-info/${this.groupId}/edit`;
    }

    if (this.createType === 1) {
      typeName = '分店';
    } else if (this.createType === 2) {
      typeName = '教練課';
    } else if (this.createType === 3) {
      typeName = '群組';
    } else {
      typeName = '品牌';
    }
    this.dialog.open(MsgDialogComponent, {
      hasBackdrop: true,
      data: {
        title: 'Message',
        body: `是否要取消新增${typeName}`,
        href
      }
    });
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
    if (_type !== 3) {
      this.dialog.open(PeopleSelectorWinComponent, {
        hasBackdrop: true,
        data: {
          title: `品牌管理員選擇設定`,
          adminLevel: `${_type}`,
          adminLists,
          onConfirm: this.handleConfirm.bind(this)
        }
      });
    }
  }
}
