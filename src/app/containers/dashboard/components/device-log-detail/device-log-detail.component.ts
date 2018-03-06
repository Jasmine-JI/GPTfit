import {
  Component,
  OnInit,
  ViewChild,
  HostListener,
  Inject
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DeviceLogService } from '../../services/device-log.service';
import { HttpParams } from '@angular/common/http';
import {
  MatTableDataSource,
  MatPaginator,
  PageEvent,
  MatSort,
  Sort,
  MatPaginatorIntl,
  MatDatepickerInputEvent
} from '@angular/material';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/fromEvent';
import { Router } from '@angular/router';
import * as moment from 'moment';
import {
  BreakpointObserver,
  BreakpointState,
  Breakpoints
} from '@angular/cdk/layout';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Location } from '@angular/common';
import { DOCUMENT } from '@angular/platform-browser';
import { WINDOW } from '@shared/services/window.service';

@Component({
  selector: 'app-device-log-detail',
  templateUrl: './device-log-detail.component.html',
  styleUrls: ['./device-log-detail.component.css']
})
export class DeviceLogDetailComponent implements OnInit {
  userId: string;
  logSource = new MatTableDataSource<any>();
  totalCount: number;
  currentPage: PageEvent;
  currentSort: Sort;
  userInfo: string;
  isHandset$: Observable<boolean>;
  complexForm: FormGroup;
  startDate: any;
  endDate: any;
  isDateSearch = false;
  getDataTime: string;
  isTopIconDisplay = false;

  @ViewChild('paginator') paginator: MatPaginator;
  @ViewChild('sortTable') sortTable: MatSort;
  @ViewChild('f') form: any;
  constructor(
    private route: ActivatedRoute,
    private deviceLogservice: DeviceLogService,
    private matPaginatorIntl: MatPaginatorIntl,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private fb: FormBuilder,
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
    this.isHandset$ = this.breakpointObserver
      .observe(Breakpoints.Handset)
      .map(match => match.matches);

    this.userId = this.route.snapshot.paramMap.get('userId');

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
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const number = this.window.pageYOffset || this.document.documentElement.scrollTop || this.document.body.scrollTop || 0;
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
    this.deviceLogservice.fetchLists(params).subscribe(res => {
      this.logSource.data = res.datas;
      if (res.datas.length > 0) {
        this.userInfo = res.datas[0].info;
      }
      this.totalCount = res.meta.pageCount;
      this.getDataTime = moment().format('YYYY-MM-DD hh:mm:ss');
    });
  }

  logStartDateChange($event: MatDatepickerInputEvent<moment.Moment>) {
    // 配合save_device_log的time欄位 是YYYY-MM-DD hh:mm:ss.000000
    const value = moment($event.value).format('YYYY-MM-DD 00:00:00.000000');
    this.complexForm.patchValue({ startDate: value });
  }

  logEndDateChange($event: MatDatepickerInputEvent<moment.Moment>) {
    // 配合save_device_log的time欄位 是YYYY-MM-DD hh:mm:ss.000000
    const value = moment($event.value).format('YYYY-MM-DD 23:59:59.000000');
    this.complexForm.patchValue({ endDate: value });
  }
  submit({ value, valid }) {
    if (valid) {
      this.isDateSearch = true;
    } else {
      this.isDateSearch = false;
    }
    this.getLists();
  }
  refreshLists(event) {
    this.currentPage = {
      pageIndex: 0,
      pageSize: 10,
      length: null
    };

    this.form.resetForm();
    this.getLists();
  }

  goTop() {
    window.scrollTo(1170, 0);
  }
}
