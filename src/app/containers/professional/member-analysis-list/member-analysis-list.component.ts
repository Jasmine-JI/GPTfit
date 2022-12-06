import { Component, OnInit } from '@angular/core';
import { Api41xxService, AuthService } from '../../../core/services';
import { Api4106Post, Api4106Response } from '../../../core/models/api/api-41xx';

@Component({
  selector: 'app-member-analysis-list',
  templateUrl: './member-analysis-list.component.html',
  styleUrls: ['./member-analysis-list.component.scss'],
})
export class MemberAnalysisListComponent implements OnInit {
  post: Api4106Post = {
    token: this.authService.token,
    groupId: '',
    type: 1, // 1. 管理員 2. 學員
  };

  list: Api4106Response;

  constructor(private api41xxService: Api41xxService, private authService: AuthService) {}

  ngOnInit(): void {
    this.getMemberList();
  }

  /**
   * 取得人員類別
   */
  getMemberList() {
    this.api41xxService.fetchGetGroupMemberAnalysisList(this.post).subscribe((res) => {
      this.list = res;
    });
  }
}
