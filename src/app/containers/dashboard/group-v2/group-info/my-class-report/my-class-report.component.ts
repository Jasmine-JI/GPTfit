import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { GroupDetailInfo, UserSimpleInfo, MemberInfo } from '../../../models/group-detail';
import { CalenderDay } from '../../../models/report';
import { GroupService } from '../../../services/group.service';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { Subject, combineLatest, of } from 'rxjs';
import { takeUntil, map, switchMap, first } from 'rxjs/operators';
import moment from 'moment';
import { ActivityService } from '../../../../../shared/services/activity.service';
import { QrcodeService } from '../../../../portal/services/qrcode.service';
import * as _Highcharts from 'highcharts';
import { TranslateService } from '@ngx-translate/core';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';
import { Router } from '@angular/router';
import { HashIdService } from '../../../../../shared/services/hash-id.service';
import { SportsReportContent } from '../../../../../shared/models/sports-report'

const errMsg = `Error.<br />Please try again later.`;

@Component({
  selector: 'app-my-class-report',
  templateUrl: './my-class-report.component.html',
  styleUrls: ['./my-class-report.component.scss']
})
export class MyClassReportComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  /**
   * UI會用到的各個flag
   */
  uiFlag = {
    isDebugMode: false,
    isPreviewMode: false,
    isLoading: false,
    noData: true
  };

  /**
   * 此群組相關資料
   */
  groupInfo = <GroupDetailInfo>{};

  /**
   * 使用者個人資訊（含權限）
   */
  userSimpleInfo: UserSimpleInfo;

  /**
   * 產生報告所需資料
   */
  sportsReportContent: SportsReportContent = {
    reportType: 'my-class',
    sportType: 1,
    dateRange: {
      startTimestamp: null,
      endTimestamp: null
    },
    image: null,
    nameInfo: {
      name: null
    },
    sportsInfo: {
      numOfData: null
    }
  };

  constructor(
    private groupService: GroupService,
    private utils: UtilsService,
    private activityService: ActivityService,
    private translate: TranslateService,
    private userProfileService: UserProfileService,
    private hashIdService: HashIdService,
    private router: Router,
    private qrcodeService: QrcodeService
  ) { }

  ngOnInit(): void {
    this.initPage();
  }

  /**
   * 取得已儲存的群組詳細資訊、階層群組資訊、使用者資訊
   * @author kidin-1091020
   */
  initPage() {
    combineLatest([
      this.groupService.getRxGroupDetail(),
      this.groupService.getRxCommerceInfo(),
      this.groupService.getUserSimpleInfo()
    ]).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(resArr => {
      this.groupInfo = resArr[0];
      Object.assign(resArr[0], {groupLevel: this.utils.displayGroupLevel(resArr[0].groupId)});
      Object.assign(resArr[0], {expired: resArr[1].expired});
      Object.assign(resArr[0], {commerceStatus: resArr[1].commerceStatus});
      this.userSimpleInfo = resArr[2];
    })

  }

  /**
   * 取消rxjs訂閱和卸除highchart
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
