import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {
  MatTableDataSource,
  MatPaginator,
  PageEvent,
  MatSort,
  Sort,
  MatPaginatorIntl
} from '@angular/material';
// import { ActivityService } from '../../services/activity.service';
// import { UtilsService } from '@shared/services/utils.service';
import { HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-my-device',
  templateUrl: './my-device.component.html',
  styleUrls: ['./my-device.component.css', '../../../group/group-style.css']
})
export class MyDeviceComponent implements OnInit {
  testDatas = [
    { modelName: 'AT500', deviceName: '跑步機', deviceSN: 'B21T0500010598' },
    { modelName: 'WB001', deviceName: '穿戴式裝置', deviceSN: 'A51WB001000589' }
  ];
  logSource = new MatTableDataSource<any>();
  totalCount: number;
  currentPage: PageEvent;
  currentSort: Sort;
  isLoading = false;
  isEmpty = false;
  @ViewChild('paginator')
  paginator: MatPaginator;
  constructor(
    private matPaginatorIntl: MatPaginatorIntl,
    // private activityService: ActivityService,
    // private utils: UtilsService,
    private router: Router
  ) {}

  ngOnInit() {
    // 設定顯示筆數資訊文字
    this.matPaginatorIntl.getRangeLabel = (
      page: number,
      pageSize: number,
      length: number
    ): string => {
      if (length === 0 || pageSize === 0) {
        return `第 0 筆、共 ${length} 筆`;
      }

      length = Math.max(length, 0);
      const startIndex = page * pageSize;
      const endIndex =
        startIndex < length
          ? Math.min(startIndex + pageSize, length)
          : startIndex + pageSize;

      return `第 ${startIndex + 1} - ${endIndex} 筆、共 ${length} 筆`;
    };
    this.currentPage = {
      pageIndex: 0,
      pageSize: 10,
      length: null
    };

    this.currentSort = {
      active: '',
      direction: ''
    };
    this.logSource.data = this.testDatas;
    // this.token = this.utils.getToken();
    // this.getLists();

    // // 分頁切換時，重新取得資料
    // this.paginator.page.subscribe((page: PageEvent) => {
    //   this.currentPage = page;
    //   this.getLists();
    // });
  }
  changeSort(sortInfo: Sort) {
    this.currentSort = sortInfo;
    // this.getLists();
  }
  goDetail(id) {
    this.router.navigateByUrl(`dashboard/device/info/${id}`);
  }
}
