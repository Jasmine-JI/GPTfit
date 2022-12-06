import { Component, OnInit } from '@angular/core';
import { Api41xxService, AuthService } from '../../../core/services';
import { SystemAnalysisType } from '../../../core/enums/api/api-41xx.enum';
import { combineLatest } from 'rxjs';
import {
  Api4101Post,
  Api4101Response,
  Api4102Post,
  Api4102Response,
} from '../../../core/models/api/api-41xx';
import * as dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

@Component({
  selector: 'app-system-operation-report',
  templateUrl: './system-operation-report.component.html',
  styleUrls: ['./system-operation-report.component.scss'],
})
export class SystemOperationReportComponent implements OnInit {
  /**
   * api 4101-4102 post 所需參數
   */
  postInfo = {
    token: this.authService.token,
    type: SystemAnalysisType.group,
    startDate: dayjs().startOf('isoWeek').diff(1, 'week').valueOf(),
    endDate: dayjs().endOf('isoWeek').diff(1, 'week').valueOf(),
    dateUnit: 1, // 1. 週 2. 月
    get api4101Post(): Api4101Post {
      const { token, type } = this;
      return { token, type };
    },
    get api4102Post(): Api4102Post {
      const { token, type, startDate, endDate, dateUnit } = this;
      return { token, type, startDate, endDate, dateUnit };
    },
  };

  operationInfo: Api4101Response;
  operationTrend: Api4102Response;

  constructor(private api41xxService: Api41xxService, private authService: AuthService) {}

  ngOnInit(): void {
    this.getReportInfo();
  }

  /**
   * 串接api 4101-4102獲取頁面所需資訊
   */
  getReportInfo() {
    combineLatest([this.getOperationInfo(), this.getOperationTrend()]).subscribe((resArray) => {
      [this.operationInfo, this.operationTrend] = resArray as [Api4101Response, Api4102Response];
    });
  }

  /**
   * 取得系統營運分析概要資訊
   */
  getOperationInfo() {
    return this.api41xxService.fetchGetSystemOperationInfo(this.postInfo.api4101Post);
  }

  /**
   * 取得營運分析趨勢
   */
  getOperationTrend() {
    return this.api41xxService.fetchGetSystemOperationTrend(this.postInfo.api4102Post);
  }
}
