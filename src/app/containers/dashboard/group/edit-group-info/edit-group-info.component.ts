import {
  Component,
  OnInit,
  ViewEncapsulation,
  HostListener
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

@Component({
  selector: 'app-edit-group-info',
  templateUrl: './edit-group-info.component.html',
  styleUrls: ['./edit-group-info.component.css', '../group-style.css'],
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
  normalMemberInfos: any;
  remindText = '※不得超過32個字元';
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
  maxFileSize = 524288;
  isUploading = false;
  fileLink: string;
  reloadFileText = '重新上傳';
  chooseFileText = '選擇檔案';
  acceptFileExtensions = ['JPG', 'JPEG', 'GIF', 'PNG'];
  finalImageLink: string;
  get groupName() {
    return this.form.get('groupName');
  }
  get groupDesc() {
    return this.form.get('groupDesc');
  }
  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private utils: UtilsService,
    private router: Router,
    private fb: FormBuilder,
    private userInfoService: UserInfoService,
    public dialog: MatDialog
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
    this.groupId = this.route.snapshot.paramMap.get('groupId');
    this.form = this.fb.group({
      groupName: ['', [Validators.required, Validators.maxLength(32)]],
      groupDesc: ['', [Validators.required, Validators.maxLength(500)]]
    });
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
    let params = new HttpParams();
    params = params.set('groupId', this.groupId);
    this.groupService.fetchGroupListDetail(body).subscribe(res => {
      this.groupInfo = res.info;
      const {
        groupIcon,
        groupId,
        groupName,
        groupDesc,
        selfJoinStatus
      } = this.groupInfo;
      if (selfJoinStatus) {
        this.joinStatus = selfJoinStatus;
      } else {
        this.joinStatus = 0;
      }
      this.form.patchValue({ groupName, groupDesc });
      this.groupImg = this.utils.buildBase64ImgString(groupIcon);
      this.finalImageLink = this.groupImg;
      this.group_id = this.utils.displayGroupId(groupId);
      this.groupLevel = this.utils.displayGroupLevel(groupId);
    });
    this.getGroupMemberList(1);
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
          this.subBranchInfo = this.subGroupInfo.branches.map(_branch => {
            return {
              ..._branch,
              groupIcon: this.utils.buildBase64ImgString(_branch.groupIcon)
            };
          });
          this.subCoachInfo = this.subGroupInfo.coaches.map(_coach => {
            return {
              ..._coach,
              groupIcon: this.utils.buildBase64ImgString(_coach.groupIcon)
            };
          });
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
          this.normalMemberInfos = this.groupInfos.filter(
            _info => _info.accessRight === '90' && _info.joinStatus === 2
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
  manage({ value, valid }) {
    const { groupName, groupDesc } = value;
    const body = {
      token: this.token,
      groupId: this.groupId,
      groupName,
      groupIcon: this.finalImageLink || '',
      groupDesc
    };
    this.groupService.editGroup(body).subscribe(res => {
      if (res.resultCode === 200) {
        this.router.navigateByUrl(`/dashboard/group-info/${this.groupId}`);
      }
    });
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
  goCreatePage(_type) {
    this.router.navigateByUrl(
      `/dashboard/group-info/${this.groupId}/create?type=${_type}`
    );
  }
  handleWaittingMemberInfo(id: string) {
    if (id) {
      this.groupInfos = this.groupInfos.filter(_info => _info.memberId !== id);
    }
  }
  handleRemoveAdmin(id: string, type: number) {
    if (id) {
      if (type === 1) {
        this.brandAdministrators = this.brandAdministrators.filter(_info => _info.memberId !== id);
      } else if (type === 2) {
        this.branchAdministrators = this.branchAdministrators.filter(_info => _info.memberId !== id);
      } else {
        this.coachAdministrators = this.coachAdministrators.filter(_info => _info.memberId !== id);
      }
    }
  }
  handleAssignAdmin(id: string) {
    if (id) {
      this.normalMemberInfos = this.normalMemberInfos.filter(_info => _info.memberId !== id);
    }
  }
}
