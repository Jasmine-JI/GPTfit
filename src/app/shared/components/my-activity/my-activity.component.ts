import {
  Component,
  OnInit,
  ViewChild,
  Input
} from '@angular/core';
import {
  MatTableDataSource,
  MatPaginator,
  PageEvent,
  Sort,
  MatDatepickerInputEvent,
  MatInput
} from '@angular/material';
import { ActivityService } from '@shared/services/activity.service';
import { UtilsService } from '@shared/services/utils.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { HashIdService } from '@shared/services/hash-id.service';
import * as moment from 'moment';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { TranslateService } from '@ngx-translate/core';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'app-my-activity',
  templateUrl: './my-activity.component.html',
  styleUrls: ['./my-activity.component.css']
})
export class MyActivityComponent implements OnInit {
  logSource = new MatTableDataSource<any>();
  totalCount: number;
  currentPage: PageEvent;
  currentSort: Sort;
  token: string;
  isLoading = false;
  isEmpty = false;
  targetUserId: string;
  filterStartTime = moment().add(-1, 'years').format('YYYY-MM-DDTHH:mm:00.000+08:00');
  filterEndTime = moment().format('YYYY-MM-DDTHH:mm:00.000+08:00');
  sportType = '99';
  searchWords = '';
  @Input() isPortal = false;
  @Input() userName;
  @ViewChild('picker', { read: MatInput }) input: MatInput;

  @ViewChild('paginator')
  paginator: MatPaginator;
  constructor(
    private activityService: ActivityService,
    private utils: UtilsService,
    private router: Router,
    private route: ActivatedRoute,
    private hashIdService: HashIdService,
    public dialog: MatDialog,
    private translate: TranslateService,
    private breakpointObserver: BreakpointObserver
  ) {}
  // Check if device is phone or tablet
  get isMobile() {
    return this.breakpointObserver.isMatched('(max-width: 767px)');
  }
  ngOnInit() {
    const queryStrings = this.utils.getUrlQueryStrings(location.search);
    const { pageNumber, startTime, endTime, type, searchWords } = queryStrings;
    this.filterStartTime = startTime
      ? moment(startTime).format('YYYY-MM-DDTHH:mm:00.000+08:00')
      : moment().add(-1, 'years').format('YYYY-MM-DDTHH:mm:00.000+08:00');
    this.filterEndTime = endTime
      ? moment(endTime).format('YYYY-MM-DDT23:59:00.000+08:00')
      : moment().format('YYYY-MM-DDT23:59:00.000+08:00');
    this.sportType = type ? type.toString() : '99';
    this.searchWords = searchWords && searchWords.length > 0 ? searchWords.toString() : '';
    this.targetUserId = this.hashIdService.handleUserIdDecode(
      this.route.snapshot.paramMap.get('userId')
    );
    this.currentPage = {
      pageIndex: +pageNumber - 1 || 0,
      pageSize: 10,
      length: null
    };

    this.currentSort = {
      active: '',
      direction: ''
    };
    this.token = this.utils.getToken() || '';
    this.getLists();

    // 分頁切換時，重新取得資料
    this.paginator.page.subscribe((page: PageEvent) => {
      this.currentPage = page;
      if (this.isPortal) {
        this.router.navigateByUrl(
          `${location.pathname}?pageNumber=${this.currentPage.pageIndex + 1}&
          startTime=${this.filterStartTime.slice(
            0,
            10
          )}&endTime=${this.filterEndTime.slice(0, 10)}&type=${this.sportType}&searchWords=${this.searchWords}`
        );
      } else {
        this.router.navigateByUrl(
          `/dashboard/activity-list?pageNumber=${this.currentPage
            .pageIndex + 1}&startTime=${this.filterStartTime.slice(
            0,
            10
          )}&endTime=${this.filterEndTime.slice(0, 10)}&type=${
            this.sportType
          }&searchWords=${this.searchWords}`
        );
      }
      this.getLists();
    });
  }

  changeSort(sortInfo: Sort) {
    this.currentSort = sortInfo;
    this.getLists();
  }
  search() {
    this.currentPage.pageIndex = 0;
    this.router.navigateByUrl(
      `${location.pathname}?startTime=${this.filterStartTime.slice(
        0,
        10
      )}&endTime=${this.filterEndTime.slice(0, 10)}&type=${
        this.sportType
      }&searchWords=${this.searchWords}`
    );
    let isAfter;
    if (this.filterEndTime.length > 0 && this.filterStartTime.length === 0) {
      isAfter = true;
    } else {
      isAfter = moment(this.filterEndTime).isAfter(
        moment(this.filterStartTime)
      );
    }
    if (isAfter) {
      this.getLists();
    } else {
      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'message',
          body: this.translate.instant('universal_race_timelineIncorrect'),
          confirmText: this.translate.instant('universal_operating_confirm')
        }
      });
    }
  }
  getLists() {
    this.isLoading = true;
    const body = {
      token: this.token,
      type: this.sportType,
      page: (this.currentPage && this.currentPage.pageIndex.toString()) || '0',
      pageCounts:
        (this.currentPage && this.currentPage.pageSize.toString()) || '10',
      searchWords: this.searchWords,
      filterStartTime: this.filterStartTime
        ? moment(this.filterStartTime).format('YYYY-MM-DDTHH:mm:00.000+08:00')
        : '',
      filterEndTime: moment(this.filterEndTime).format(
        'YYYY-MM-DDTHH:mm:00.000+08:00'
      ),
      targetUserId: ''
    };
    if (this.targetUserId) {
      body.targetUserId = this.targetUserId;
    }
    this.activityService.fetchSportList(body).subscribe(res => {
      this.isLoading = false;

      if (res.resultCode === 200) {
        this.logSource.data = res.info;

        this.totalCount = res.totalCounts;
        if (this.logSource.data.length === 0) {
          this.isEmpty = true;
        } else {
          this.isEmpty = false;
        }
      }
    });
  }
  handleDateChange(
    $event: MatDatepickerInputEvent<moment.Moment>,
    isStartTime: boolean
  ) {
    if (isStartTime) {
      this.filterStartTime = moment($event.value).format(
        'YYYY-MM-DDTHH:mm:00.000+08:00'
      );
    } else {
      this.filterEndTime = moment($event.value).format(
        'YYYY-MM-DDT23:59:00.000+08:00'
      );
    }
  }
  goDetail(fileId) {
    if (this.isPortal) {
      return this.router.navigateByUrl(`/activity/${fileId}`);
    }
    this.router.navigateByUrl(`/dashboard/activity/${fileId}`);
  }
  reset() {
    this.filterStartTime = moment().add(-1, 'years').format('YYYY-MM-DDTHH:mm:00.000+08:00');
    this.filterEndTime = moment().format('YYYY-MM-DDTHH:mm:00.000+08:00');
    this.sportType = '99';
    this.searchWords = '';
  }
}
