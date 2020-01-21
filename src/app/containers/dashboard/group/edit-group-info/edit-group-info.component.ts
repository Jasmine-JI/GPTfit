import {
  Component,
  OnInit,
  ViewEncapsulation,
  HostListener,
  Inject
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { UtilsService } from '@shared/services/utils.service';
import { HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { UserInfoService } from '../../services/userInfo.service';
import { MsgDialogComponent } from '../../components/msg-dialog/msg-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { MatBottomSheet, MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA} from '@angular/material';
import { toCoachText } from '../desc';
import { TranslateService } from '@ngx-translate/core';
import { HashIdService } from '@shared/services/hash-id.service';
import * as moment from 'moment';

@Component({
  selector: 'app-edit-group-info',
  templateUrl: './edit-group-info.component.html',
  styleUrls: ['./edit-group-info.component.css', '../group-style.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EditGroupInfoComponent implements OnInit {
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
  normalCoaches: any;
  PFCoaches: any;
  normalMemberInfos: any;
  remindText = '※不得超過32個字元';
  remindVideoText = '請輸入直播影片的嵌入式語句';
  isVideoEdit = false;
  inValidText = '欄位為必填';
  textareaMaxLength = 500;
  form: FormGroup;
  formTextName = 'groupName';
  formUrlName = 'groupVideoUrl';
  formTextareaName = 'groupDesc';
  role = {
    isSupervisor: false,
    isSystemDeveloper: false,
    isSystemMaintainer: false,
    isMarketingDeveloper: false,
    isBrandAdministrator: false,
    isBranchAdministrator: false,
    isCoach: false
  };
  maxFileSize = 10485760; // 10MB
  fileLink: string;
  reloadFileText = '重新上傳';
  chooseFileText = '選擇檔案';
  acceptFileExtensions = ['JPG', 'JPEG', 'GIF', 'PNG'];
  finalImageLink: string;
  imgCropping = false;
  visitorDetail: any;
  isLoading = false;
  isGroupDetailLoading = false;
  videoUrl = '';
  originalGroupStatus: number;
  updateImgQueryString = '';
  brandType: any;
  get groupName() {
    return this.form.get('groupName');
  }
  get groupDesc() {
    return this.form.get('groupDesc');
  }
  get groupVideoUrl() {
    return this.form.get('groupVideoUrl');
  }
  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private utils: UtilsService,
    private router: Router,
    private fb: FormBuilder,
    private userInfoService: UserInfoService,
    public dialog: MatDialog,
    private bottomSheet: MatBottomSheet,
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
    this.route.params.subscribe(_params => this.handleInit());
    this.userInfoService.getUserAccessRightDetail().subscribe(res => {
      this.visitorDetail = res;
    });

    this.utils.getImgSelectedStatus().subscribe(res => {
      this.imgCropping = res;
    });
  }
  handleInit() {
    this.groupId = this.hashIdService.handleGroupIdDecode(
      this.route.snapshot.paramMap.get('groupId')
    );
    if (this.groupId.length === 0) {
      return this.router.navigateByUrl('/404');
    }
    this.form = this.fb.group({
      groupStatus: ['', [Validators.required]],
      groupName: ['', [Validators.required, Validators.maxLength(32)]],
      groupDesc: ['', [Validators.required, Validators.maxLength(500)]],
      groupVideoUrl: ['']
    });
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
      // console.log('%c this.isMarketingDeveloper', 'color: #0ca011', res);
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
    this.token = this.utils.getToken();
    const body = {
      token: this.token,
      groupId: this.groupId,
      avatarType: 2
    };
    let params = new HttpParams();
    params = params.set('groupId', this.groupId);
    this.isGroupDetailLoading = true;
    this.groupService.fetchGroupListDetail(body).subscribe(res => {
      this.isGroupDetailLoading = false;
      this.groupInfo = res.info;
      const {
        groupIcon,
        groupId,
        groupName,
        groupDesc,
        selfJoinStatus,
        groupStatus,
        groupVideoUrl,
        brandType
      } = this.groupInfo;

      this.brandType = brandType;

      this.originalGroupStatus = groupStatus;

      this.groupService.getImgUpdatedStatus().subscribe(response => {
        this.updateImgQueryString = response;
      });

      this.videoUrl = groupVideoUrl;
      if (groupStatus === 4) {
        this.router.navigateByUrl(`/404`);
      }
      if (selfJoinStatus) {
        this.joinStatus = selfJoinStatus;
      } else {
        this.joinStatus = 0;
      }
      this.form.patchValue({
        groupName,
        groupDesc,
        groupStatus,
        groupVideoUrl
      });
      this.groupImg = `${groupIcon}${this.updateImgQueryString}`;
      this.finalImageLink = this.groupImg;
      this.group_id = this.utils.displayGroupId(groupId);
      this.groupLevel = this.utils.displayGroupLevel(groupId);
      if (this.groupLevel === '80') {
        this.getGroupMemberList(2);
      } else {
        this.getGroupMemberList(1);
      }
    });
  }
  handleActionGroup(_type) {
    const body = {
      token: this.token,
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
  dimissGroup(e, type) {
    e.preventDefault();
    let targetName = '';
    if (+this.brandType === 1) {
      if (type === 2) {
        targetName = this.translate.instant('Dashboard.Group.GroupInfo.branch');
      } else if (type === 3) {
        targetName = this.translate.instant('Dashboard.Group.GroupInfo.coachingClass');
      } else {
        targetName = this.translate.instant('Dashboard.Group.group');
      }
    } else {
      if (type === 2) {
        targetName = this.translate.instant('other.subCom');
      } else if (type === 3) {
        targetName = this.translate.instant('other.department');
      } else {
        targetName = this.translate.instant('Dashboard.Group.group');
      }
    }

    this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: 'message',
        body: this.translate.instant('Dashboard.Group.confirmDissolution', {
          target: targetName
        }),
        confirmText: this.translate.instant('SH.determine'),
        cancelText: this.translate.instant('SH.cancel'),
        onConfirm: this.handleDimissGroup.bind(this)
      }
    });
  }
  handleDimissGroup() {
    const body = {
      token: this.token,
      groupId: this.groupId,
      changeStatus: '4',
      groupLevel: this.groupLevel
    };
    this.groupService.changeGroupStatus(body).subscribe(_res => {
      if (_res.resultCode === 200) {
        this.router.navigateByUrl(`/dashboard/my-group-list`);
      }
    });
  }
  getGroupMemberList(_type) {
    this.isLoading = true;
    const body = {
      token: this.token,
      groupId: this.groupId,
      groupLevel: this.groupLevel,
      infoType: _type,
      avatarType: 3
    };
    this.groupService.fetchGroupMemberList(body).subscribe(res => {
      this.isLoading = false;
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
              // 過濾解散群組
              return _branch;
            }
          }).map(_branch => {
            return {
              ..._branch,
              groupIcon: _branch.groupIcon
            };
          });
          this.subCoachInfo = this.subGroupInfo.coaches.filter(_coach => {
            if (_coach.groupStatus !== 4) {
              // 過濾解散群組
              return _coach;
            }
          }).map(_coach => {
            return {
              ..._coach,
              groupIcon: _coach.groupIcon
            };
          });
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
          if (this.groupLevel === '40') {
            this.branchAdministrators = this.groupInfos.filter(
              _info =>
                _info.accessRight === '40' && _info.groupId === this.groupId
            );
          } else {
            this.branchAdministrators = this.groupInfos.filter(_info => {
              if (_info.accessRight === '40') {
                const idx = this.subBranchInfo.findIndex(
                  _subBranch => _subBranch.groupId === _info.groupId
                );
                if (idx > -1) {
                  _info.memberName =
                    this.subBranchInfo[idx].groupName + '/' + _info.memberName;
                  return _info;
                }
              }
            });
          }
          if (this.groupLevel === '60') {
            // 如果是教練課群組
            this.normalCoaches = this.groupInfos.filter(
              // 一般教練
              _info =>
                _info.accessRight === '60' && _info.groupId === this.groupId
            );
            this.PFCoaches = this.groupInfos.filter(
              // 體適能教練
              _info =>
                _info.accessRight === '50' && _info.groupId === this.groupId
            );
          } else {
            this.coachAdministrators = this.groupInfos.filter(_info => {
              if (_info.accessRight === '60' || _info.accessRight === '50') {
                const idx = this.subCoachInfo.findIndex(
                  _subCoach => _subCoach.groupId === _info.groupId
                );
                if (idx > -1) {
                  _info.memberName =
                    this.subCoachInfo[idx].groupName + '/' + _info.memberName;
                  return _info;
                }
              }
            });
          }
          this.normalMemberInfos = this.groupInfos.filter(
            _info => _info.accessRight === '90' && _info.joinStatus === 2
          );
        }
      }
    });
  }
  changeGroupInfo({ index }) {
    if (this.groupLevel === '80') {
      if (index === 0) {
        this.getGroupMemberList(index + 2);
      } else if (index === 1) {
        this.getGroupMemberList(index + 2);
      } else {
        this.getGroupMemberList(index + 2);
      }
    } else {
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
  }
  manage({ value, valid }) {
    if (valid) {
      const { groupName, groupDesc, groupStatus, groupVideoUrl } = value;
      const image = new Image();
      image.src = this.finalImageLink;
      image.onload = () => {
        const body1 = {
          token: this.token,
          groupId: this.groupId,
          groupLevel: this.groupLevel,
          groupName,
          groupIcon: this.utils.imageToDataUri(image, 256, 256) || '',
          groupIconMid: this.utils.imageToDataUri(image, 128, 128) || '',
          groupIconSamll: this.utils.imageToDataUri(image, 64, 64) || '',
          groupDesc,
          groupVideoUrl
        };
        const body2 = {
          token: this.token,
          groupId: this.groupId,
          changeStatus: groupStatus,
          groupLevel: this.groupLevel
        };
        this.isGroupDetailLoading = true;
        this.groupService.editGroup(body1).subscribe(res1 => {
          this.isGroupDetailLoading = false;
          if (res1.resultCode === 200) {
            if (this.originalGroupStatus !== groupStatus) {
              this.groupService.changeGroupStatus(body2).subscribe(res2 => {
                if (res2.resultCode === 200) {
                  this.router.navigateByUrl(
                    `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(
                      this.groupId
                    )}`
                  );
                  this.groupService.setImgUpdatedImgStatus(`?${moment().format('YYYYMMDDhhmmss')}`);
                } else {
                  this.dialog.open(MsgDialogComponent, {
                    hasBackdrop: true,
                    data: {
                      title: 'Message',
                      body: this.translate.instant(
                        'Dashboard.Group.groupEditFailed'
                      )
                    }
                  });
                  this.groupService.setImgUpdatedImgStatus('');
                }
              });
            } else {
              this.router.navigateByUrl(
                `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(
                  this.groupId
                )}`
              );
              this.groupService.setImgUpdatedImgStatus(`?${moment().format('YYYYMMDDhhmmss')}`);
            }
          } else if (res1.resultCode === 409) {
            this.dialog.open(MsgDialogComponent, {
              hasBackdrop: true,
              data: {
                title: 'Message',
                body: this.translate.instant(
                  'Dashboard.Group.duplicateBrand'
                )
              }
            });
          } else if (res1.resultCode === 400) {
            this.dialog.open(MessageBoxComponent, {
              hasBackdrop: true,
              data: {
                title: 'message',
                body: res1.resultMessage
              }
            });
          } else {
            this.dialog.open(MsgDialogComponent, {
              hasBackdrop: true,
              data: {
                title: 'Message',
                body: this.translate.instant(
                  'Dashboard.Group.groupEditFailed'
                )
              }
            });
          }
        });
      };
    }
  }
  public handleChangeTextarea(code: string, type: number): void {
    if (type === 1) {
      return this.form.patchValue({ groupDesc: code });
    }
    if (code && code.length > 0) {
      const re = /src\s*=\s*"(.+?)"/i;
      const arr = code.match(re);
      let groupVideoUrl = code;
      if (arr) {
        groupVideoUrl = arr[1];
        this.videoUrl = groupVideoUrl;
        this.isVideoEdit = true;
        this.form.patchValue({ groupVideoUrl });
      } else {
        this.videoUrl = code;
      }
    }
  }
  switchVideoLink() {
    this.isVideoEdit = !this.isVideoEdit;
  }
  handleAttachmentChange(file) {
    if (file) {
      const {isTypeCorrect, errorMsg, link } = file;
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
  goCreatePage(_type, e) {
    e.preventDefault();
    if (_type === 1) {
      this.router.navigateByUrl(
        `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(
          this.groupId
        )}/create?createType=1`
      );
    } else {
      this.bottomSheet.open(BottomSheetComponent, {
        data: { groupId: this.groupId, brandType: this.brandType }
      });
    }
  }
  handleWaittingMemberInfo(id: string) {
    if (id) {
      this.groupInfos = this.groupInfos.filter(_info => _info.memberId !== id);
    }
  }
  handleRemoveAdmin(id: string, type: number) {
    if (id) {
      if (type === 1) {
        this.brandAdministrators = this.brandAdministrators.filter(
          _info => _info.memberId !== id
        );
      } else if (type === 2) {
        this.branchAdministrators = this.branchAdministrators.filter(
          _info => _info.memberId !== id
        );
      } else if (type === 3) {
        this.coachAdministrators = this.coachAdministrators.filter(
          _info => _info.memberId !== id
        );
      } else if (type === 4) {
        // 針對教練群組，刪除一般教練或體適能教練
        this.normalCoaches = this.normalCoaches.filter(
          _info => _info.memberId !== id
        );
        this.PFCoaches = this.PFCoaches.filter(_info => _info.memberId !== id);
      } else {
        this.normalMemberInfos = this.normalMemberInfos.filter(
          _info => _info.memberId !== id
        );
      }
    }
  }
  handleRemoveGroup(id: string, type: number) {
    if (id) {
      if (id === this.groupId) {
        this.router.navigateByUrl('/dashboard/my-group-list');
      }
      if (type === 2) {
        this.subBranchInfo = this.subBranchInfo.filter(
          _branch => _branch.groupId !== id
        );
      } else {
        this.subCoachInfo = this.subCoachInfo.filter(
          _coach => _coach.groupId !== id
        );
      }
    }
  }
  handleAssignAdmin(id: string) {
    if (id) {
      this.normalMemberInfos = this.normalMemberInfos.filter(
        _info => _info.memberId !== id
      );
    }
  }
}

@Component({
  selector: 'app-bottom-sheet',
  templateUrl: 'bottom-sheet.html'
})
export class BottomSheetComponent {
  title: string;
  confirmText: string;
  cancelText: string;
  constructor(
    private bottomSheetRef: MatBottomSheetRef<BottomSheetComponent>,
    private router: Router,
    public dialog: MatDialog,
    private utils: UtilsService,
    private translate: TranslateService,
    private hashIdService: HashIdService,
    @Inject(MAT_BOTTOM_SHEET_DATA) private data: any
  ) {
    this.translate.onLangChange.subscribe(() => {
      this.getAndInitTranslations();
    });
    this.getAndInitTranslations();
  }
  get groupId() {
    return this.data.groupId;
  }
  get brandType () {
    return this.data.brandType;
  }

  getAndInitTranslations() {
    this.translate
      .get([
        'Dashboard.Group.disclaimer',
        'SH.agree',
        'SH.disagree'
      ])
      .subscribe(translation => {
        this.title = translation['Dashboard.Group.disclaimer'];
        this.confirmText = translation['SH.agree'];
        this.cancelText = translation['SH.disagree'];
      });
  }
  openLink(event: MouseEvent, type: number): void {
    let coachType = null;
    if (type === 1 || type === 2) {
      coachType = type;
    }
    if (type === 3) {
      event.preventDefault();
    }
    this.bottomSheetRef.dismiss();
    if (type === 1 || type === 2) {
      if (+this.brandType === 1) {
        const langName = this.utils.getLocalStorageObject('locale');
        const text = toCoachText[langName];
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: this.title,
            body: text,
            confirmText: this.confirmText,
            cancelText: this.cancelText,
            onConfirm: () => {
              this.router.navigateByUrl(
                `/dashboard/group-info/${
                this.hashIdService.handleGroupIdEncode(this.groupId)
                }/create?createType=2&coachType=${coachType}`
              );
            }
          }
        });
      } else {
        this.router.navigateByUrl(
          `/dashboard/group-info/${
          this.hashIdService.handleGroupIdEncode(this.groupId)
          }/create?createType=2&coachType=${coachType}`
        );
      }
    }
  }
}
