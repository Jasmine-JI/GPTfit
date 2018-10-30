import {
  Component,
  OnInit,
  ViewChild,
  OnDestroy
} from '@angular/core';
import {
  MatTableDataSource,
  MatPaginator,
  PageEvent,
  Sort,
  MatPaginatorIntl
} from '@angular/material';
import { ActivityService } from '../../services/activity.service';
import { UtilsService } from '@shared/services/utils.service';
import { HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { GlobalEventsManager } from '@shared/global-events-manager';

@Component({
  selector: 'app-my-activity',
  templateUrl: './my-activity.component.html',
  styleUrls: ['./my-activity.component.css', '../../group/group-style.css']
})
export class MyActivityComponent implements OnInit, OnDestroy {
  logSource = new MatTableDataSource<any>();
  totalCount: number;
  currentPage: PageEvent;
  currentSort: Sort;
  token: string;
  isLoading = false;
  isEmpty = false;
  @ViewChild('paginator')
  paginator: MatPaginator;
  constructor(
    private matPaginatorIntl: MatPaginatorIntl,
    private activityService: ActivityService,
    private utils: UtilsService,
    private router: Router,
    private globalEventsManager: GlobalEventsManager
  ) {}

  ngOnInit() {
    this.globalEventsManager.setFooterRWD(1); // 為了讓footer長高85px
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
    this.token = this.utils.getToken();
    this.getLists();

    // 分頁切換時，重新取得資料
    this.paginator.page.subscribe((page: PageEvent) => {
      this.currentPage = page;
      this.getLists();
    });
  }
  ngOnDestroy() {
    this.globalEventsManager.setFooterRWD(0); // 為了讓footer自己變回去預設值
  }
  changeSort(sortInfo: Sort) {
    this.currentSort = sortInfo;
    this.getLists();
  }
  getLists() {
    this.isLoading = true;
    const sort = this.currentSort.direction;
    // let params = new HttpParams();
    // params = params.set(
    //   'page',
    //   (this.currentPage && this.currentPage.pageIndex.toString()) || '0'
    // );
    // params = params.set(
    //   'pageCounts',
    //   (this.currentPage && this.currentPage.pageSize.toString()) || '10'
    // );
    // params = params.set('sort', sort);
    const body = {
      token: '8bb87a0a79a8568a5cbfb73b597eb484',
      type: '9',
      page: this.currentPage && this.currentPage.pageIndex.toString() || '0',
      pageCounts: this.currentPage && this.currentPage.pageSize.toString() || '10',
      filterStartTime: '',
      filterEndTime: '2018-10-07T23:59:59+08:00'
    };
    this.activityService.fetchSportList(body).subscribe(res => {
      this.isLoading = false;
      this.logSource.data = res.info;

      this.totalCount = res.totalCounts;
      if (this.logSource.data.length === 0) {
        this.isEmpty = true;
      } else {
        this.isEmpty = false;
      }
    });
  }
  goDetail(id) {
    this.router.navigateByUrl(`dashboard/my-activity/detail/${id}`);
  }
}
