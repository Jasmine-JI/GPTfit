import {
  Component,
  OnInit,
  ViewChild,
  HostListener,
  Inject,
  ViewEncapsulation
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DeviceLogService } from '../../services/device-log.service';
import { HttpParams } from '@angular/common/http';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import dayjs, { Dayjs } from 'dayjs';
import {
  BreakpointObserver,
  Breakpoints
} from '@angular/cdk/layout';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Location, DOCUMENT } from '@angular/common';

import { WINDOW } from '@shared/services/window.service';
import { UtilsService } from '@shared/services/utils.service';

@Component({
  selector: 'app-device-log-detail',
  templateUrl: './device-log-detail.component.html',
  styleUrls: ['./device-log-detail.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DeviceLogDetailComponent implements OnInit {
  userId: string;
  logSource = new MatTableDataSource<any>();
  totalCount: number;
  currentPage: PageEvent;
  pageSize: number;
  currentSort: Sort;
  userInfo: string;
  isHandset$: Observable<boolean>;
  complexForm: FormGroup;
  startDate: any;
  endDate: any;
  isDateSearch = false;
  getDataTime: string;
  isTopIconDisplay = false;
  isLoadingResults = false;
  isRateLimitReached = false;

  @ViewChild('paginatorA', {static: true}) paginatorA: MatPaginator;
  @ViewChild('paginatorB', {static: true}) paginatorB: MatPaginator;
  @ViewChild('sortTable', {static: false}) sortTable: MatSort;
  @ViewChild('f', {static: false}) form: any;
  constructor(
    private route: ActivatedRoute,
    private deviceLogservice: DeviceLogService,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private fb: FormBuilder,
    private utils: UtilsService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(WINDOW) private window,
    public _location: Location // 調用location.back()，來回到上一頁
  ) {
    this.complexForm = this.fb.group({
      // 定義表格的預設值
      startDate: [this.startDate, Validators.required],
      endDate: [this.endDate, Validators.required]
    });
  }

  ngOnInit() {
    const queryStrings = this.utils.getUrlQueryStrings(location.search);
    const { pageNumber } = queryStrings;
    this.isHandset$ = this.breakpointObserver
      .observe(Breakpoints.Handset)
      .pipe(
        map(match => match.matches)
      );

    this.userId = this.route.snapshot.paramMap.get('userId');

    // // 設定顯示筆數資訊文字
    // this.matPaginatorIntl.getRangeLabel = (
    //   page: number,
    //   pageSize: number,
    //   length: number
    // ): string => {
    //   if (length === 0 || pageSize === 0) {
    //     return `第 0 筆、共 ${length} 筆`;
    //   }

    //   length = Math.max(length, 0);
    //   const startIndex = page * pageSize;
    //   const endIndex =
    //     startIndex < length
    //       ? Math.min(startIndex + pageSize, length)
    //       : startIndex + pageSize;

    //   return `第 ${startIndex + 1} - ${endIndex} 筆、共 ${length} 筆`;
    // };
    this.currentPage = {
      pageIndex: (+pageNumber - 1) || 0,
      pageSize: 10,
      length: null
    };

    this.currentSort = {
      active: '',
      direction: ''
    };
    this.getLists();
    // 分頁切換時，重新取得資料
    this.paginatorA.page.subscribe((page: PageEvent) => {
      this.currentPage = page;
      this.pageSize = this.currentPage.pageSize;
      this.router.navigateByUrl(`${location.pathname}?pageNumber=${this.currentPage.pageIndex + 1}`);
      this.getLists();
    });

    this.paginatorB.page.subscribe((page: PageEvent) => {
      this.currentPage = page;
      this.pageSize = this.currentPage.pageSize;
      this.router.navigateByUrl(`${location.pathname}?pageNumber=${this.currentPage.pageIndex + 1}`);
      this.getLists();
    });
  }
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const number =
      this.window.pageYOffset ||
      this.document.documentElement.scrollTop ||
      this.document.body.scrollTop ||
      0;
    if (number > 80) {
      this.isTopIconDisplay = true;
    } else if (number === 0) {
      this.isTopIconDisplay = false;
    }
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
    if (this.isDateSearch) {
      params = params.set('startDate', this.complexForm.get('startDate').value);
      params = params.set('endDate', this.complexForm.get('endDate').value);
    }
    params = params.set('userId', this.userId);
    params = params.set('pageNumber', pageNumber);
    params = params.set('pageSize', pageSize);
    params = params.set('sort', sort);
    this.isLoadingResults = true;
    this.deviceLogservice.fetchLists(params).subscribe(
      res => {
        this.isLoadingResults = false;
        this.isRateLimitReached = false;
        this.logSource.data = res.datas;
        if (res.datas.length > 0) {
          this.userInfo = res.datas[0].info;
        }
        this.totalCount = res.meta.pageCount;
        this.getDataTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
      },
      err => {
        this.isLoadingResults = false;
        // Catch if the API has reached its rate limit. Return empty data.
        this.isRateLimitReached = true;
      }
    );
  }

  logStartDateChange($event: MatDatepickerInputEvent<Dayjs>) {
    // 配合save_device_log的time欄位 是YYYY-MM-DD hh:mm:ss.000000
    const value = dayjs($event.value).format('YYYY-MM-DD 00:00:00.000000');
    this.complexForm.patchValue({ startDate: value });
  }

  logEndDateChange($event: MatDatepickerInputEvent<Dayjs>) {
    // 配合save_device_log的time欄位 是YYYY-MM-DD hh:mm:ss.000000
    const value = dayjs($event.value).format('YYYY-MM-DD 23:59:59.000000');
    this.complexForm.patchValue({ endDate: value });
  }
  submit({ value, valid }) {
    if (valid) {
      this.isDateSearch = true;
      this.getLists();
    } else {
      this.isDateSearch = false;
    }
  }
  refreshLists(event) {
    this.currentPage.pageIndex = 0;

    this.form.resetForm();
    this.getLists();
  }

  goTop() {
    window.scrollTo(1170, 0);
  }
}
