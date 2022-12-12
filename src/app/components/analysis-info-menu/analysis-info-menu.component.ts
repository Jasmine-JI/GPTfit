import { NgModule, Component, OnInit, Input } from '@angular/core';
import { HashIdService } from '../../core/services';
import { ReportCondition } from '../../shared/models/report-condition';
import { QueryString } from '../../shared/enum/query-string';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ReportDateUnit } from '../../shared/classes/report-date-unit';

@Component({
  selector: 'app-analysis-info-menu',
  templateUrl: './analysis-info-menu.component.html',
  styleUrls: ['./analysis-info-menu.component.scss'],
})
export class AnalysisInfoMenuComponent implements OnInit {
  /**
   * 指定的群組/個人資訊
   */
  @Input() assignInfo: any;

  /**
   * 報告條件
   */
  @Input() reportCondition: ReportCondition;

  constructor(private hashIdService: HashIdService) {}

  ngOnInit(): void {}

  /**
   * 取得指定對象的基本資訊頁面網址
   * @param id {string | number}-群組或使用者編號
   * @author kidin-1110401
   */
  getAssignInfoUrl(id: string | number) {
    const { object } = this.assignInfo;
    return object === 'group'
      ? this.getPersonalInfoUrl(id as number)
      : this.getGroupInfoUrl(id as string);
  }

  /**
   * 取得目前選單的基本資訊頁面網址
   * @param id {string | number}-群組或使用者編號
   * @author kidin-1110401
   */
  getMainInfoUrl(id: string | number) {
    const { object } = this.assignInfo;
    return object === 'group'
      ? this.getGroupInfoUrl(id as string)
      : this.getPersonalInfoUrl(id as number);
  }

  /**
   * 取得個人的基本資訊頁面網址
   * @param id {number}-使用者編號
   * @author kidin-1110401
   */
  getPersonalInfoUrl(id: number) {
    const { origin } = location;
    const hashId = this.hashIdService.handleUserIdEncode(`${id}`);
    return `${origin}/user-profile/${hashId}`;
  }

  /**
   * 取得群組的基本資訊頁面網址
   * @param id {string}-群組編號
   * @author kidin-1110401
   */
  getGroupInfoUrl(id: string) {
    const { origin } = location;
    const hashId = this.hashIdService.handleGroupIdEncode(id);
    return `${origin}/dashboard/group-info/${hashId}/group-introduction`;
  }

  /**
   * 取得指定對象的運動報告頁面網址
   * @param id {string | number}-群組或使用者編號
   * @author kidin-1110401
   */
  getSportsReportUrl(id: string | number) {
    const { object } = this.assignInfo;
    return object === 'group'
      ? this.getGroupSportsReportUrl(id as string)
      : this.getPersonalSportsReportUrl(id as number);
  }

  /**
   * 取得群組的運動報告頁面網址
   * @param id {string}-群組編號
   * @author kidin-1110401
   */
  getGroupSportsReportUrl(id: string) {
    const { origin } = location;
    const hashId = this.hashIdService.handleGroupIdEncode(id);
    return `${origin}/dashboard/group-info/${hashId}/sports-report${this.addReportQueryString()}`;
  }

  /**
   * 取得個人的運動報告頁面網址
   * @param id {number}-使用者編號
   * @author kidin-1110401
   */
  getPersonalSportsReportUrl(id: number) {
    const { origin } = location;
    const hashId = this.hashIdService.handleUserIdEncode(`${id}`);
    return `${origin}/user-profile/${hashId}/sport-report`;
  }

  /**
   * 將報告條件加入query string，以顯示相同條件之報告
   */
  addReportQueryString() {
    const { baseTime, compareTime, sportType, dateUnit } = this.reportCondition;
    const { startTimestamp: baseStartTime, endTimestamp: baseEndTime } = baseTime;
    let query = `?${QueryString.baseStartTime}=${baseStartTime}&${
      QueryString.baseEndTime
    }=${baseEndTime}&${QueryString.dateRangeUnit}=${(dateUnit as ReportDateUnit).unit}&${
      QueryString.sportType
    }=${sportType}`;

    if (compareTime) {
      const { startTimestamp: compareStartTime, endTimestamp: compareEndTime } = compareTime;
      query += `&${QueryString.compareStartTime}=${compareStartTime}&${QueryString.compareEndTime}=${compareEndTime}`;
    }

    return query;
  }

  /**
   * 取得菜單位置，如太低或太右，則偏移至安全位置
   * @author kidin-1110401
   */
  getMenuPosition() {
    const { x, y } = this.assignInfo.position;
    const { innerWidth, innerHeight } = window;
    let newX = x;
    let newY = y;
    const menuSafeWidth = 260;
    const menuSafeHeight = 300;
    if (x + menuSafeWidth > innerWidth) {
      newX = innerWidth - menuSafeWidth;
    }

    if (y + menuSafeHeight > innerHeight) {
      newY = innerHeight - menuSafeHeight;
    }

    return { x: `${newX}px`, y: `${newY}px` };
  }
}

@NgModule({
  declarations: [AnalysisInfoMenuComponent],
  exports: [AnalysisInfoMenuComponent],
  imports: [CommonModule, TranslateModule],
})
export class AnalysisInfoMenuModule {}
