import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Api41xxService, AuthService, HashIdService } from '../../../core/services';
import {
  Api4104Post,
  Api4104Response,
  Api4105Post,
  Api4105Response,
} from '../../../core/models/api/api-41xx';
import * as dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { combineLatest } from 'rxjs';

dayjs.extend(isoWeek);

@Component({
  selector: 'app-group-analysis-report',
  templateUrl: './group-analysis-report.component.html',
  styleUrls: ['./group-analysis-report.component.scss'],
})
export class GroupAnalysisReportComponent implements OnInit {
  post = {
    token: this.authService.token,
    groupId: '',
    startDate: dayjs().startOf('isoWeek').diff(1, 'week').valueOf(),
    endDate: dayjs().endOf('isoWeek').diff(1, 'week').valueOf(),
    dateUnit: 1,
    get api4104Post(): Api4104Post {
      const { token, groupId } = this;
      return { token, groupId };
    },
    get api4105Post(): Api4105Post {
      const { token, groupId, startDate, endDate, dateUnit } = this;
      return { token, groupId, startDate, endDate, dateUnit };
    },
  };

  analysisInfo: Api4104Response;
  analysisTrend: Api4105Response;

  constructor(
    private api41xxService: Api41xxService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private hashIdService: HashIdService
  ) {}

  ngOnInit(): void {
    this.getParamInfo();
    this.getReportInfo();
  }

  /**
   * 從網址取得所需資訊
   */
  getParamInfo() {
    const hashGroupId = this.route.snapshot.paramMap.get('groupId');
    if (hashGroupId) this.post.groupId = this.hashIdService.handleGroupIdDecode(hashGroupId);
  }

  /**
   * 取得營運分析報告資訊
   */
  getReportInfo() {
    combineLatest([this.getAnalysisInfo(), this.getAnalysisTrend()]).subscribe((res) => {
      [this.analysisInfo, this.analysisTrend] = res as [Api4104Response, Api4105Response];
    });
  }

  /**
   * 取得群組營運分析概要
   */
  getAnalysisInfo() {
    return this.api41xxService.fetchGetGroupOperationDetail(this.post.api4104Post);
  }

  /**
   * 取得群組營運分析趨勢
   */
  getAnalysisTrend() {
    return this.api41xxService.fetchGetGroupOperationTrend(this.post.api4105Post);
  }
}
