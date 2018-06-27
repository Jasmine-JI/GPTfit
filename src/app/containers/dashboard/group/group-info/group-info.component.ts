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
    this.getGroupMemberList();
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
  getGroupMemberList() {
    const body = {
      token: this.token,
      groupId: this.groupId,
      infoType: '2'
    };
    this.groupService.fetchGroupMemberList(body).subscribe(res => {
      if (res.resultCode === 200) {
        const {
          info: { groupMemberInfo }
        } = res;
        this.groupInfos = groupMemberInfo;
      }
    });
  }
}
