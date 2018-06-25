import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { GroupService } from '../../services/group.service';
import {
  MatTableDataSource,
  MatPaginator,
  PageEvent,
  MatSort,
  Sort,
  MatPaginatorIntl
} from '@angular/material';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/fromEvent';
import { Router } from '@angular/router';
import { UtilsService } from '@shared/services/utils.service';

@Component({
  selector: 'app-my-group-list',
  templateUrl: './my-group-list.component.html',
  styleUrls: ['./my-group-list.component.css']
})
export class MyGroupListComponent implements OnInit {
  logSource = new MatTableDataSource<any>();
  totalCount: number;
  currentPage: PageEvent;
  currentSort: Sort;
  infoOptions: any;
  selectedValue = '';
  token: string;
  @ViewChild('paginator') paginator: MatPaginator;
  @ViewChild('sortTable') sortTable: MatSort;
  @ViewChild('filter') filter: ElementRef;

  constructor(
    private groupService: GroupService,
    private matPaginatorIntl: MatPaginatorIntl,
    private router: Router,
    private utils: UtilsService
  ) {
  }

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
    this.token = this.utils.getToken();
    this.getLists();

    // 分頁切換時，重新取得資料
    this.paginator.page.subscribe((page: PageEvent) => {
      this.currentPage = page;
      this.getLists();
    });
  }
  changeSort(sortInfo: Sort) {
    this.currentSort = sortInfo;
    this.getLists();
  }
  getLists() {
    const pageNumber = (this.currentPage.pageIndex + 1).toString();
    const pageSize = this.currentPage.pageSize.toString();
    const sort = this.currentSort.direction;
    const body = {
      token: this.token,
      category: '2',
      groupLevel: '90',
      searchWords: '',
      page: '0',
      pageCounts: '10'
    };
    this.groupService.fetchGroupList(body).subscribe(res => {
      this.logSource.data = res.info.groupList;
      this.totalCount = res.info.totalCounts;
    });
  }

  goDetail(groupId) {
    this.router.navigateByUrl(`dashboard/group-info/${groupId}`);
  }
  selectTarget(_value) {
    this.selectedValue = encodeURIComponent(_value).trim();
  }
}
