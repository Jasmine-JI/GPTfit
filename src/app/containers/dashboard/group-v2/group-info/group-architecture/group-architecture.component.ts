import { Component, OnInit, OnDestroy } from '@angular/core';

import { GroupDetailInfo } from '../../../models/group-detail';
import { GroupService } from '../../../services/group.service';
import { UtilsService } from '../../../../../shared/services/utils.service';

import { Subject } from 'rxjs';
import { takeUntil, map, switchMap } from 'rxjs/operators';


@Component({
  selector: 'app-group-architecture',
  templateUrl: './group-architecture.component.html',
  styleUrls: ['./group-architecture.component.scss']
})
export class GroupArchitectureComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  groupInfo = <GroupDetailInfo>{};
  groupArchitecture = {};

  constructor(
    private groupService: GroupService,
    private utils: UtilsService
  ) { }

  ngOnInit(): void {

  }

  /**
   * 取得目前頁面群組資訊
   * @author kidin-1090813
   */
  getCurrentGroupInfo() {
    this.groupService.getGroupInfo().subscribe(res => {
      this.groupInfo = res;
    });

  }

  /**
   * 先取得頁面群組資訊再取得群組階層
   * @author kidin-1090813
   */
  getGroupArchitecture() {

    let body = {
      token: this.utils.getToken() || '',
      avatarType: 3,
      groupId: this.groupInfo.groupId,
      groupLevel: this.utils.displayGroupLevel(this.groupInfo.groupId),
      infoType: 1
    }
    this.groupService.getGroupInfo().pipe(
      switchMap(res => this.groupService.fetchGroupMemberList(body).pipe(
        map(resp => resp)
      )),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.groupInfo = res;
    });

    this.groupService.fetchGroupMemberList(body).subscribe(res => {
      if (res.resultCode !== 200) {
        console.log(`${res.apiCode}：`, res.resultMessage);
      } else {
        this.groupArchitecture = res.info.subGroupInfo;
      }

    });

  }

  ngOnDestroy() {}

}
