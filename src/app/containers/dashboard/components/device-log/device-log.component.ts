import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { DeviceLogService } from '../../services/device-log.service';
import { MatPaginator, PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { debounce, getUrlQueryStrings } from '../../../../core/utils';
import { appPath } from '../../../../app-path.const';
import { Subject, merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { QueryString } from '../../../../core/enums/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { NgFor, NgIf } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-device-log',
  templateUrl: './device-log.component.html',
  styleUrls: ['./device-log.component.scss'],
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    NgFor,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
    MatSortModule,
    NgIf,
    MatProgressSpinnerModule,
  ],
})
export class DeviceLogComponent implements OnInit, OnDestroy {
  ngUnsubscribe = new Subject();

  logSource = new MatTableDataSource<any>();
  totalCount: number;
  currentPage: PageEvent;
  currentSort: Sort;
  infoOptions: any;
  selectedValue = '';
  isLoading = false;

  @ViewChild('paginatorA', { static: true }) paginatorA: MatPaginator;
  @ViewChild('paginatorB', { static: true }) paginatorB: MatPaginator;
  @ViewChild('sortTable', { static: false }) sortTable: MatSort;
  @ViewChild('filter', { static: false }) filter: ElementRef;

  constructor(private deviceLogservice: DeviceLogService, private router: Router) {
    this.searchInfo = debounce(this.searchInfo, 1000);
  }

  ngOnInit() {
    const queryStrings = getUrlQueryStrings(location.search);
    const { pageNumber } = queryStrings;
    this.currentPage = {
      pageIndex: +pageNumber - 1 || 0,
      pageSize: 10,
      length: null,
    };

    this.currentSort = {
      active: '',
      direction: '',
    };

    this.getLists('changePage');

    this.subscribePaginator();
  }

  /**
   * 訂閱分頁變更事件，並重新取得資料
   */
  subscribePaginator() {
    merge(this.paginatorA.page, this.paginatorB.page)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((page: PageEvent) => {
        const { dashboard, adminManage } = appPath;
        this.currentPage = page;
        this.router.navigateByUrl(
          `/${dashboard.home}/${adminManage.home}/${adminManage.deviceLog.home}?${
            QueryString.pageNumber
          }=${this.currentPage.pageIndex + 1}`
        );
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
    this.deviceLogservice.fetchLists(params).subscribe((res) => {
      this.isLoading = false;
      this.logSource.data = res.datas;
      this.totalCount = res.meta.pageCount;
    });
  }

  goDetail(userId) {
    this.router.navigateByUrl(
      `${location.pathname}/${appPath.adminManage.deviceLog.detail}/${userId}`
    );
  }

  searchInfo(e) {
    const keyword = e.target.value;
    let params = new HttpParams();
    params = params.set('keyword', keyword);
    this.deviceLogservice.searchKeyword(params).subscribe((res) => {
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
      this.deviceLogservice.fetchLists(params).subscribe((res) => {
        this.logSource.data = res.datas;
        this.totalCount = res.meta.pageCount;
      });
    }
  }

  selectTarget(_value) {
    this.selectedValue = encodeURIComponent(_value).trim();
  }

  /**
   * 取消rxjs訂閱
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
