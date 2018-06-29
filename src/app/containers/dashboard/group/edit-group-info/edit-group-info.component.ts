import { Component, OnInit, ViewEncapsulation } from '@angular/core';
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
  formTextClassName = 'form-field';
  remindText = '※不得超過32個字元';
  remindTextarea = '※不得超過500個字元';
  form: FormGroup;
  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private utils: UtilsService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('groupId');
    this.form = this.fb.group({
      groupName: ['', Validators.required, Validators.maxLength(32)],
      groupDesc: ['', Validators.required, Validators.maxLength(500)]
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
      // this.form.patchValue({ groupName, groupDesc });
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
  goEditPage() {
    this.router.navigateByUrl(`${location.pathname}/edit`);
  }
}
