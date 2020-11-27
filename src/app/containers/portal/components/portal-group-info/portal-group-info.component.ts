import { Component, OnInit, OnDestroy } from '@angular/core';
import { GroupService } from 'app/containers/dashboard/services/group.service';
import { UtilsService } from '@shared/services/utils.service';
import { ActivatedRoute } from '@angular/router';
import { UserInfoService } from 'app/containers/dashboard/services/userInfo.service';
import { Router } from '@angular/router';
import { GlobalEventsManager } from '@shared/global-events-manager';
import { HashIdService } from '@shared/services/hash-id.service';

@Component({
  selector: 'app-portal-group-info',
  templateUrl: './portal-group-info.component.html',
  styleUrls: [
    './portal-group-info.component.scss',
    '../../../dashboard/group/group-style.scss'
  ]
})
export class PortalGroupInfoComponent implements OnInit, OnDestroy {
  groupInfo: any;
  groupImg: string;
  groupId: string;
  dispGroupId: string;
  isGroupAdmin = false;
  groupLevel: number;
  constructor(
    private groupService: GroupService,
    private utils: UtilsService,
    private route: ActivatedRoute,
    private userInfoService: UserInfoService,
    private router: Router,
    private globalEventsManager: GlobalEventsManager,
    private hashIdService: HashIdService
  ) {}

  ngOnInit() {
    this.globalEventsManager.setFooterRWD(1);
    this.groupId = this.hashIdService.handleGroupIdDecode(
      this.route.snapshot.paramMap.get('groupId')
    );
    this.groupLevel = this.utils.displayGroupLevel(this.groupId);
    const token = this.utils.getToken() || '';
    if (token) {

      this.groupService.checkAccessRight(this.groupId).subscribe(res => {
        this.isGroupAdmin = res.some(_accessRight => _accessRight === this.groupLevel);
        if (res[0] > 99) {
          this.router.navigateByUrl(`/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(this.groupId)}`);
        }

      });

    }

    const body = {
      token,
      groupId: this.groupId,
      avatarType: 2
    };

    this.groupService.fetchGroupListDetail(body).subscribe(res => {
      this.groupInfo = res.info;
      const { groupIcon, groupStatus } = this.groupInfo;
      if (groupStatus === 4 || groupStatus === 3) {
        return this.router.navigateByUrl(`/404`);
      }
      this.groupImg =
        groupIcon && groupIcon.length > 0
          ? groupIcon
          : '/assets/images/group-default.svg';
      this.dispGroupId = this.utils.displayGroupId(this.groupId);
    });

  }

  goDashboardGroupInfo() {
    this.utils.setLocalStorageObject('isAutoApplyGroup', true);
    this.router.navigateByUrl(`/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(this.groupId)}`);
  }

  ngOnDestroy() {
  }

}
