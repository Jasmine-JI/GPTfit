import { Component, OnInit, OnDestroy, ViewChild, Input } from '@angular/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatInput } from '@angular/material/input';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AuthService, HashIdService, UserService, Api21xxService } from '../../../core/services';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import dayjs, { Dayjs } from 'dayjs';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '../../components/message-box/message-box.component';
import { TranslateService } from '@ngx-translate/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { Unit } from '../../enum/value-conversion';
import { getUrlQueryStrings } from '../../../core/utils/index';

@Component({
  selector: 'app-my-activity',
  templateUrl: './my-activity.component.html',
  styleUrls: ['./my-activity.component.scss'],
})
export class MyActivityComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  logSource = new MatTableDataSource<any>();
  totalCount: number;
  currentPage: PageEvent;
  currentSort: Sort;
  token: string;
  isLoading = false;
  isEmpty = false;
  targetUserId: string;
  filterStartTime = dayjs().add(-1, 'year').format('YYYY-MM-DDTHH:mm:00.000Z');
  filterEndTime = dayjs().format('YYYY-MM-DDTHH:mm:00.000Z');
  sportType = '99';
  searchWords = '';
  unit: Unit = 0;
  @Input() isPortal = false;
  @Input() userName;
  @ViewChild('picker', { read: MatInput }) input: MatInput;

  @ViewChild('paginator', { static: true })
  paginator: MatPaginator;
  constructor(
    private api21xxService: Api21xxService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private hashIdService: HashIdService,
    public dialog: MatDialog,
    private translate: TranslateService,
    private breakpointObserver: BreakpointObserver,
    private userService: UserService
  ) {}
  // Check if device is phone or tablet
  get isMobile() {
    return this.breakpointObserver.isMatched('(max-width: 767px)');
  }

  ngOnInit() {
    this.getUserUnit();
    const queryStrings = getUrlQueryStrings(location.search);
    const { pageNumber, startTime, endTime, type, searchWords, debug } = queryStrings;
    this.filterStartTime = startTime
      ? dayjs(startTime).format('YYYY-MM-DDTHH:mm:00.000Z')
      : dayjs().add(-1, 'year').format('YYYY-MM-DDTHH:mm:00.000Z');
    this.filterEndTime = endTime
      ? dayjs(endTime).format('YYYY-MM-DDT23:59:00.000Z')
      : dayjs().format('YYYY-MM-DDT23:59:00.000Z');
    this.sportType = type ? type.toString() : '99';
    this.searchWords = searchWords && searchWords.length > 0 ? searchWords.toString() : '';
    this.targetUserId = this.hashIdService.handleUserIdDecode(
      this.route.snapshot.paramMap.get('userId')
    );
    this.currentPage = {
      pageIndex: +pageNumber - 1 || 0,
      pageSize: 10,
      length: null,
    };

    this.currentSort = {
      active: '',
      direction: '',
    };
    this.token = this.authService.token;
    this.getLists();

    // 分頁切換時，重新取得資料
    this.paginator.page.subscribe((page: PageEvent) => {
      this.currentPage = page;
      if (this.isPortal) {
        this.router.navigateByUrl(
          `${location.pathname}?pageNumber=${
            this.currentPage.pageIndex + 1
          }&startTime=${this.filterStartTime.slice(0, 10)}&endTime=${this.filterEndTime.slice(
            0,
            10
          )}&type=${this.sportType}&searchWords=${this.searchWords}${
            debug !== undefined ? '&debug=' : ''
          }`
        );
      } else {
        this.router.navigateByUrl(
          `/dashboard/activity-list?pageNumber=${
            this.currentPage.pageIndex + 1
          }&startTime=${this.filterStartTime.slice(0, 10)}&endTime=${this.filterEndTime.slice(
            0,
            10
          )}&type=${this.sportType}&searchWords=${this.searchWords}${
            debug !== undefined ? '&debug=' : ''
          }`
        );
      }

      this.getLists();
    });
  }

  /**
   * 從userProfile取得使用者使用單位
   * @author kidin-1100601
   */
  getUserUnit() {
    this.unit = this.userService.getUser().userProfile.unit;
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
      )}&endTime=${this.filterEndTime.slice(0, 10)}&type=${this.sportType}&searchWords=${
        this.searchWords
      }`
    );
    let isAfter;
    if (this.filterEndTime.length > 0 && this.filterStartTime.length === 0) {
      isAfter = true;
    } else {
      isAfter = dayjs(this.filterEndTime).isAfter(dayjs(this.filterStartTime));
    }
    if (isAfter) {
      this.getLists();
    } else {
      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'message',
          body: this.translate.instant('universal_race_timelineIncorrect'),
          confirmText: this.translate.instant('universal_operating_confirm'),
        },
      });
    }
  }

  getLists() {
    this.isLoading = true;
    const body = {
      token: this.token,
      type: this.sportType,
      page: (this.currentPage && this.currentPage.pageIndex.toString()) || '0',
      pageCounts: (this.currentPage && this.currentPage.pageSize.toString()) || '10',
      searchWords: this.searchWords,
      filterStartTime: this.filterStartTime
        ? dayjs(this.filterStartTime).format('YYYY-MM-DDTHH:mm:00.000Z')
        : '',
      filterEndTime: dayjs(this.filterEndTime).format('YYYY-MM-DDTHH:mm:00.000Z'),
      targetUserId: '',
    };
    if (this.targetUserId) {
      body.targetUserId = this.targetUserId;
    }
    this.api21xxService.fetchSportList(body).subscribe((res) => {
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

  handleDateChange($event: MatDatepickerInputEvent<Dayjs>, isStartTime: boolean) {
    if (isStartTime) {
      this.filterStartTime = dayjs($event.value).format('YYYY-MM-DDTHH:mm:00.000Z');
    } else {
      this.filterEndTime = dayjs($event.value).format('YYYY-MM-DDT23:59:00.000Z');
    }
  }

  goDetail(fileId) {
    let debugString = '';
    if (location.search.includes('debug=')) {
      debugString = '?debug=';
    }

    if (this.isPortal) {
      return this.router.navigateByUrl(`/activity/${fileId}${debugString}`);
    } else {
      this.router.navigateByUrl(`/dashboard/activity/${fileId}${debugString}`);
    }
  }

  reset() {
    this.filterStartTime = dayjs().add(-1, 'year').format('YYYY-MM-DDTHH:mm:00.000Z');
    this.filterEndTime = dayjs().format('YYYY-MM-DDTHH:mm:00.000Z');
    this.sportType = '99';
    this.searchWords = '';
  }

  /**
   * 解除rxjs訂閱
   * @author kidin-1090722
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
