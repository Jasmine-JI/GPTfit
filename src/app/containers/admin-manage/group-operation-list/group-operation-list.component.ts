import { Component, OnInit } from '@angular/core';
import { Api41xxService, AuthService } from '../../../core/services';
import { Api4103Post, Api4103Response } from '../../../core/models/api/api-41xx';

@Component({
  selector: 'app-group-operation-list',
  templateUrl: './group-operation-list.component.html',
  styleUrls: ['./group-operation-list.component.scss'],
})
export class GroupOperationListComponent implements OnInit {
  post: Api4103Post = {
    token: this.authService.token,
    filter: {
      commerceStatus: 0,
      brandType: 0,
      plan: 0,
      expiredStatus: 0,
      brandKeyword: '',
    },
    sort: {
      type: 1,
      direction: 1,
    },
    page: {
      index: 0,
      counts: 10,
    },
  };

  list: Api4103Response;

  constructor(private api41xxService: Api41xxService, private authService: AuthService) {}

  ngOnInit(): void {
    this.getList();
  }

  /**
   * 取得群組列表
   */
  getList() {
    this.api41xxService.fetchGetBrandOperationInfoList(this.post).subscribe((res) => {
      this.list = res as Api4103Response;
    });
  }
}
