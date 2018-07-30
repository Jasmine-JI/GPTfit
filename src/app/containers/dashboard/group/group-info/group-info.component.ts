import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { UtilsService } from '@shared/services/utils.service';
import { HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserInfoService } from '../../services/userInfo.service';

@Component({
  selector: 'app-group-info',
  templateUrl: './group-info.component.html',
  styleUrls: ['./group-info.component.css', '../group-style.css'],
  encapsulation: ViewEncapsulation.None
})
export class GroupInfoComponent implements OnInit {
  groupId: string;
  token: string;
  groupInfo: any;
  groupImg: string;
  group_id: string;
  groupLevel: string;
  groupInfos: any;
  normalMemberInfos: any;
  joinStatus = 5;
  subGroupInfo: any;
  brandAdministrators: any;
  subBrandInfo: any;
  subBranchInfo: any;
  subCoachInfo: any;
  branchAdministrators: any;
  coachAdministrators: any;
  role = {
    isSupervisor: false,
    isSystemDeveloper: false,
    isSystemMaintainer: false
  };
  visitorDetail: any;
  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private utils: UtilsService,
    private router: Router,
    private userInfoService: UserInfoService
  ) {}

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('groupId');
    this.token = this.utils.getToken();
    const body = {
      token: this.token,
      groupId: this.groupId
    };
    let params = new HttpParams();
    params = params.set('groupId', this.groupId);
    this.userInfoService.getUserDetail(body, this.groupId);
    this.userInfoService.getUserAccessRightDetail().subscribe(res => {
      this.visitorDetail = res;
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
    this.groupService.fetchGroupListDetail(body).subscribe(res => {
      this.groupInfo = res.info;
      const { groupIcon, groupId, selfJoinStatus } = this.groupInfo;
      if (selfJoinStatus) {
        this.joinStatus = selfJoinStatus;
      } else {
        this.joinStatus = 5;
      }
      this.groupImg = this.utils.buildBase64ImgString(groupIcon);
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
      actionType: _type
    };
    this.groupService
      .actionGroup(body)
      .subscribe(({ resultCode, info: { selfJoinStatus } }) => {
        if (resultCode === 200) {
          if (_type === 2) {
            this.joinStatus = 5;
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
      groupLevel: this.groupLevel,
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
  goEditPage() {
    this.router.navigateByUrl(`${location.pathname}/edit`);
  }
}
