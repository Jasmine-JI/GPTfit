import { Component, OnInit, OnDestroy } from '@angular/core';

import { GroupDetailInfo, GroupArchitecture } from '../../../models/group-detail';
import { GroupService } from '../../../services/group.service';
import { UtilsService } from '../../../../../shared/services/utils.service';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-member-list',
  templateUrl: './member-list.component.html',
  styleUrls: ['./member-list.component.scss']
})
export class MemberListComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  groupInfo = <GroupDetailInfo>{};

  constructor(
    private groupService: GroupService
  ) { }

  ngOnInit(): void {
    this.getGroupDetail();
  }

  /**
   * 取得群組詳細資訊
   * @author kidin-1091020
   */
  getGroupDetail() {
    this.groupService.getRxGroupDetail().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.groupInfo = res;
    });

  }


  /**
   * 取消rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
