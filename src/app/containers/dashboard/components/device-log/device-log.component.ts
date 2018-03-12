import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DeviceLogService } from '../../services/device-log.service';
import {
  MatTableDataSource,
  MatPaginator,
  PageEvent,
  MatSort,
  Sort,
  MatPaginatorIntl
} from '@angular/material';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/fromEvent';
import { Router } from '@angular/router';
import { debounce } from '@shared/utils/';

@Component({
  selector: 'app-device-log',
  templateUrl: './device-log.component.html',
  styleUrls: ['./device-log.component.css']
})
export class DeviceLogComponent implements OnInit {
  logSource = new MatTableDataSource<any>();
  totalCount: number;
  currentPage: PageEvent;
  currentSort: Sort;
  infoOptions: any;
  selectedValue = '';

  @ViewChild('paginator') paginator: MatPaginator;
  @ViewChild('sortTable') sortTable: MatSort;
  @ViewChild('filter') filter: ElementRef;

  constructor(
    private deviceLogservice: DeviceLogService,
    private matPaginatorIntl: MatPaginatorIntl,
    private router: Router
  ) {
    this.searchInfo = debounce(this.searchInfo, 1000);
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
    let params = new HttpParams();
    const pageNumber = (this.currentPage.pageIndex + 1).toString();
    const pageSize = this.currentPage.pageSize.toString();
    const sort = this.currentSort.direction;
    params = params.set('pageNumber', pageNumber);
    params = params.set('pageSize', pageSize);
    params = params.set('sort', sort);
    this.deviceLogservice.fetchLists(params).subscribe(res => {
      this.logSource.data = res.datas;
      this.totalCount = res.meta.pageCount;
    });
  }

  goDetail(userId) {
    this.router.navigateByUrl(`${location.pathname}/detail/${userId}`);
  }
  searchInfo(e) {
    const keyword = e.target.value;
    let params = new HttpParams();
    params = params.set('keyword', keyword);
    this.deviceLogservice.searchKeyword(params).subscribe(res => {
      this.infoOptions = res;
    });
  }
  search(e) {
    if (this.selectedValue.length > 0) {
      let params = new HttpParams();
      const pageNumber = (this.currentPage.pageIndex + 1).toString();
      const pageSize = this.currentPage.pageSize.toString();
      const sort = this.currentSort.direction;
      params = params.set('pageNumber', pageNumber);
      params = params.set('pageSize', pageSize);
      params = params.set('sort', sort);
      params = params.set('keyword', this.selectedValue);
      this.deviceLogservice.fetchLists(params).subscribe(res => {
        this.logSource.data = res.datas;
        this.totalCount = res.meta.pageCount;
      });
    }

  }
  selectTarget(_value) {
    this.selectedValue = encodeURIComponent(_value).trim();
  }
}
