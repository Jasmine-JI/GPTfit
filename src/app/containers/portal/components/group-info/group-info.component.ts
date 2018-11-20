import { Component, OnInit } from '@angular/core';
import { GroupService } from 'app/containers/dashboard/services/group.service';
import { UtilsService } from '@shared/services/utils.service';
import { ActivatedRoute } from '@angular/router';
import { UserInfoService } from 'app/containers/dashboard/services/userInfo.service';
import { Router } from '@angular/router';
import { GlobalEventsManager } from '@shared/global-events-manager';

@Component({
  selector: 'app-group-info',
  templateUrl: './group-info.component.html',
  styleUrls: [
    './group-info.component.css',
    '../../../dashboard/group/group-style.css'
  ]
})
export class GroupInfoComponent implements OnInit {
  groupInfo: any;
  groupImg: string;
  groupId: string;
  dispGroupId: string;

  groupLevel: string;
  visitorDetail: any;
  constructor(
    private groupService: GroupService,
    private utils: UtilsService,
    private route: ActivatedRoute,
    private userInfoService: UserInfoService,
    private router: Router,
    private globalEventsManager: GlobalEventsManager
  ) {}

  ngOnInit() {
    this.globalEventsManager.setFooterRWD(1);
    this.groupId = this.route.snapshot.paramMap.get('groupId');
    const token = this.utils.getToken() || '';
    if (token) {
      this.userInfoService.getUserDetail({ token }, this.groupId);
      setTimeout(() => {
        this.userInfoService.getUserAccessRightDetail().subscribe(res => {
          this.visitorDetail = res;
          const { isCanManage, isGroupAdmin, accessRight, isApplying } = this.visitorDetail;
          if (this.groupInfo.groupStatus === 3 && !this.visitorDetail.isCanManage) {
            return this.router.navigateByUrl(`/404`);
          }
          if (isCanManage || isGroupAdmin || accessRight !== 'none' || isApplying) {
            this.router.navigateByUrl(`/dashboard/group-info/${this.groupId}`);
          }
        });
      } , 300);
    }
    const body = { token, groupId: this.groupId };
    this.groupService.fetchGroupListDetail(body).subscribe(res => {
      this.groupInfo = res.info;
      const {
        groupIcon,
        groupStatus
      } = this.groupInfo;
      if (groupStatus === 4 || groupStatus === 3) {
        return this.router.navigateByUrl(`/404`);
      }
      this.groupImg =
        groupIcon && groupIcon.length > 0
          ? this.utils.buildBase64ImgString(groupIcon)
          : '/assets/images/group-default.svg';
      this.dispGroupId = this.utils.displayGroupId(this.groupId);
      this.groupLevel = this.utils.displayGroupLevel(this.groupId);
    });
  }
  goDashboardGroupInfo() {
    this.utils.setLocalStorageObject('isAutoApplyGroup', true);
    this.router.navigateByUrl(`/dashboard/group-info/${this.groupId}`);
  }
}
