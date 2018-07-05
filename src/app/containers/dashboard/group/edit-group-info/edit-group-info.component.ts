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
    // this.token = this.utils.getToken();
    // const body = {
    //   token: this.token,
    //   groupId: this.groupId
    // };
    let params = new HttpParams();
    params = params.set('groupId', this.groupId);
    this.groupService.fetchGroupListDetail(params).subscribe(res => {
      this.groupInfo = res.info;
      const { groupIcon, groupId, groupName, groupDesc } = this.groupInfo;
      this.form.patchValue({ groupName, groupDesc });
      this.groupImg = this.utils.buildBase64ImgString(groupIcon);
      this.group_id = this.utils.displayGroupId(groupId);
      this.groupLevel = this.utils.displayGroupLevel(groupId);
    });
    this.groupService.getGroupJoinStatus(params).subscribe(res => {
      if (res.info) {
        this.joinStatus = res.info.joinStatus;
      } else {
        this.joinStatus = 0;
      }
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
      .subscribe(({ resultCode, rtnMsg, joinStatus }) => {
        if (resultCode === 200) {
          if (_type === 2) {
            this.joinStatus = 0;
          } else {
            this.joinStatus = joinStatus;
          }
        }
      });
  }
  getGroupMemberList(_type) {
    const body = {
      // token: this.token,
      groupId: this.groupId,
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
              group_icon: this.utils.buildBase64ImgString(_brand.group_icon)
            };
          });
          this.subBranchInfo = this.subGroupInfo.branches.map(_branch => {
            return {
              ..._branch,
              group_icon: this.utils.buildBase64ImgString(_branch.group_icon)
            };
          });
          this.subCoachInfo = this.subGroupInfo.coaches.map(_coach => {
            return {
              ..._coach,
              group_icon: this.utils.buildBase64ImgString(_coach.group_icon)
            };
          });
        } else {
          this.groupInfos = groupMemberInfo;
          this.groupInfos = this.groupInfos
            .map(_info => {
              return {
                ..._info,
                userIcon: this.utils.buildBase64ImgString(_info.userIcon)
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
    } else {
      this.getGroupMemberList(3);
    }
  }
  manage() {
    window.history.back();
  }
  public handleChangeTextarea(code): void {
    this.form.patchValue({ groupDesc: code });
  }
  handleAttachmentChange(file) {
    if (file) {
      const { isSizeCorrect, isTypeCorrect, errorMsg } = file;
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
}
