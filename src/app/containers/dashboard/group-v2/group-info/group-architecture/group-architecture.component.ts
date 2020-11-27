import { Component, OnInit, OnDestroy } from '@angular/core';

import { GroupDetailInfo, GroupArchitecture } from '../../../models/group-detail';
import { GroupService } from '../../../services/group.service';
import { UtilsService } from '../../../../../shared/services/utils.service';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


@Component({
  selector: 'app-group-architecture',
  templateUrl: './group-architecture.component.html',
  styleUrls: ['./group-architecture.component.scss']
})
export class GroupArchitectureComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  groupInfo = <GroupDetailInfo>{};
  groupArchitecture = <GroupArchitecture>{};

  constructor(
    private groupService: GroupService
  ) { }

  ngOnInit(): void {
    this.getGroupDetail();
    this.getAllLevelGroupData();
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
   * 取得所有階層群組資訊
   * @author kidin-1090716
   */
  getAllLevelGroupData() {
    this.groupService.getAllLevelGroupData().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.groupArchitecture = res;
      console.log('groupArchitecture', this.groupArchitecture);
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
