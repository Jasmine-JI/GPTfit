import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { UtilsService } from '@shared/services/utils.service';
import { HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-group-info',
  templateUrl: './group-info.component.html',
  styleUrls: ['./group-info.component.css']
})
export class GroupInfoComponent implements OnInit {
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
  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private utils: UtilsService
  ) {}

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('groupId');
    // this.token = this.utils.getToken();
    // const body = {
    //   token: this.token,
    //   groupId: this.groupId
    // };
    let params = new HttpParams();
    params = params.set('groupId', this.groupId);
    this.groupService.fetchGroupListDetail(params).subscribe(res => {
      this.groupInfo = res.info;
      const { groupIcon, groupId } = this.groupInfo;
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
        console.log(rtnMsg);
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
          console.log('this.subGroupInfo: ', this.subGroupInfo);
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
          console.log('this.subBrandInfo: ', this.subBrandInfo);
        } else {
          this.groupInfos = groupMemberInfo;
          this.brandAdministrators = this.groupInfos.filter(_info => {
            if (_info.accessRight === '30') {
              return { ..._info, userIcon: this.utils.buildBase64ImgString(_info.userIcon) };
            }
          });
          this.branchAdministrators = this.groupInfos.filter(_info => {
            if (_info.accessRight === '40') {
              return { ..._info, userIcon: this.utils.buildBase64ImgString(_info.userIcon) };
            }
          });
          this.coachAdministrators = this.groupInfos.filter(_info => {
            if (_info.accessRight === '60') {
              return { ..._info, userIcon: this.utils.buildBase64ImgString(_info.userIcon) };
            }
          });
          console.log('this.brandAdministrators: ', this.brandAdministrators);
          console.log('this.branchAdministrators: ', this.branchAdministrators);
          console.log('this.coachAdministrators: ', this.coachAdministrators);

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
}
