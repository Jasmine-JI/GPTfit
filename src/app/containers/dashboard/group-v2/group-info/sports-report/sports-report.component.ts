import { Component, OnInit, OnDestroy } from '@angular/core';
import { GroupService } from '../../../services/group.service';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { ReportService } from '../../../../../shared/services/report.service';
import { ReportConditionOpt, GroupTree } from '../../../../../shared/models/report-condition';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-sports-report',
  templateUrl: './sports-report.component.html',
  styleUrls: ['./sports-report.component.scss']
})
export class SportsReportComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  /**
   * 報告頁面可讓使用者篩選的條件
   */
  reportConditionOpt: ReportConditionOpt = {
    brandType: 2,
    reportType: 'sport',
    group: {
      brands: null,
      branches: null,
      coaches: []
    },
    sportType: 99
  }

  constructor(
    private utils: UtilsService,
    private reportService: ReportService,
    private groupService: GroupService
  ) { }

  ngOnInit(): void {
    this.getAllLevelGroupInfo();
    this.getReportSelectedCondition();
  }

  /**
   * 取得群組所有階層資訊
   * @author kidin-1091028
   */
  getAllLevelGroupInfo() {
    this.groupService.getAllLevelGroupData().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      const groupLevel = +this.utils.displayGroupLevel(res.groupId),
            group = this.reportConditionOpt.group;
      group.coaches = res.coaches;
      if (groupLevel === 30) {
        group.brands = res.brands[0];
        group.branches = res.branches;
      } else if (groupLevel === 40) {
        group.brands = null;
        group.branches = res.branches;
      } else {
        group.brands = null;
        group.branches = null;
      }

      this.setDefaultSelected(group);
      this.reportService.setReportCondition(this.reportConditionOpt);
    });

  }

  /**
   * 設定預設條件
   * @param group {GroupTree}-父子群組清單
   * @author kidin-1091029
   */
  setDefaultSelected(group: GroupTree) {
    if (group.brands !== null) {
      Object.assign(group.brands, {selected: true});
    }

    if (group.branches !== null) {
      group.branches.forEach(_branch => {
        Object.assign(_branch, {selected: true});
      });
      
    }

    group.coaches.forEach(_coach => {
      Object.assign(_coach, {selected: true});
    });

  }

  /**
   * 取得使用者所篩選的條件
   * @author kidin-1091029
   */
  getReportSelectedCondition() {
    this.reportService.getReportCondition().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      console.log('after select', res);
    });

  }


  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
