import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DeviceLogService } from '../../services/device-log.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { debounce } from '../../../../shared/utils/';
import { UtilsService } from '../../../../shared/services/utils.service';

@Component({
  selector: 'app-device-log',
  templateUrl: './device-log.component.html',
  styleUrls: ['./device-log.component.scss']
})
export class DeviceLogComponent implements OnInit {
  logSource = new MatTableDataSource<any>();
  totalCount: number;
  currentPage: PageEvent;
  currentSort: Sort;
  infoOptions: any;
  selectedValue = '';
  isLoading = false;

  @ViewChild('paginatorA', {static: true}) paginatorA: MatPaginator;
  @ViewChild('paginatorB', {static: true}) paginatorB: MatPaginator;
  @ViewChild('sortTable', {static: false}) sortTable: MatSort;
  @ViewChild('filter', {static: false}) filter: ElementRef;

  constructor(
    private deviceLogservice: DeviceLogService,
    private router: Router,
    private utils: UtilsService
  ) {
    this.searchInfo = debounce(this.searchInfo, 1000);
  }

  ngOnInit() {
    const queryStrings = this.utils.getUrlQueryStrings(location.search);
    const { pageNumber } = queryStrings;
    this.currentPage = {
      pageIndex: (+pageNumber - 1) || 0,
      pageSize: 10,
      length: null
    };

    this.currentSort = {
      active: '',
      direction: ''
    };
    this.getLists('changePage');

    // 分頁切換時，重新取得資料
    this.paginatorA.page.subscribe((page: PageEvent) => {
      this.currentPage = page;
      this.router.navigateByUrl(`/dashboard/system/device_log?pageNumber=${this.currentPage.pageIndex + 1}`);
      this.getLists('changePage');
    });

    // 分頁切換時，重新取得資料
    this.paginatorB.page.subscribe((page: PageEvent) => {
      this.currentPage = page;
      this.router.navigateByUrl(`/dashboard/system/device_log?pageNumber=${this.currentPage.pageIndex + 1}`);
      this.getLists('changePage');
    });
  }
  changeSort(sortInfo: Sort) {
    this.currentSort = sortInfo;
    this.getLists('changePage');
  }
  getLists(act) {
    this.isLoading = true;

    if (act === 'submit') {
      this.currentPage.pageIndex = 0;
    }

    let params = new HttpParams();
    const pageNumber = (this.currentPage.pageIndex + 1).toString();
    const pageSize = this.currentPage.pageSize.toString();
    const sort = this.currentSort.direction;
    params = params.set('pageNumber', pageNumber);
    params = params.set('pageSize', pageSize);
    params = params.set('sort', sort);
    this.deviceLogservice.fetchLists(params).subscribe(res => {
      this.isLoading = false;
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
      this.currentPage.pageIndex = 0;
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
