import {
  Component,
  OnInit,
  ViewChild,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import {
  MatTableDataSource,
  MatPaginator,
  PageEvent,
  Sort
} from '@angular/material';
import { ActivityService } from '@shared/services/activity.service';
import { UtilsService } from '@shared/services/utils.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { HashIdService } from '@shared/services/hash-id.service';
import * as moment from 'moment';

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
  filterStartTime = '';
  filterEndTime = moment().format('YYYY-MM-DDTHH:mm:ss.000+08:00');
  sportType = '99';
  searchWords = '';
  @Input() isPortal = false;
  @Input() userName;
  @Output() showPrivacyUi = new EventEmitter();

  @ViewChild('paginator')
  paginator: MatPaginator;
  constructor(
    private activityService: ActivityService,
    private utils: UtilsService,
    private router: Router,
    private route: ActivatedRoute,
    private hashIdService: HashIdService
  ) {}

  ngOnInit() {
    const queryStrings = this.utils.getUrlQueryStrings(location.search);
    const { pageNumber } = queryStrings;
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
    this.token = this.utils.getToken();
    this.getLists();

    // 分頁切換時，重新取得資料
    this.paginator.page.subscribe((page: PageEvent) => {
      this.currentPage = page;
      if (this.isPortal) {
        this.router.navigateByUrl(
          `${location.pathname}?pageNumber=${this.currentPage.pageIndex + 1}`
        );
      } else {
        this.router.navigateByUrl(
          `/dashboard/activity-list?pageNumber=${this.currentPage.pageIndex +
            1}`
        );
      }
      this.getLists();
    });
  }

  changeSort(sortInfo: Sort) {
    this.currentSort = sortInfo;
    this.getLists();
  }
  getLists() {
    this.isLoading = true;
    const sort = this.currentSort.direction;
    const body = {
      token: this.token,
      type: this.sportType,
      page: (this.currentPage && this.currentPage.pageIndex.toString()) || '0',
      pageCounts:
        (this.currentPage && this.currentPage.pageSize.toString()) || '10',
      filterStartTime: this.filterStartTime,
      filterEndTime: this.filterEndTime,
      targetUserId: ''
    };
    if (this.targetUserId) {
      body.targetUserId = this.targetUserId;
    }
    this.activityService.fetchSportList(body).subscribe(res => {
      this.isLoading = false;
      if (res.resultCode === 402) {
        return this.showPrivacyUi.emit(true);
      }
      if (res.resultCode === 200) {
        this.logSource.data = res.info;

        this.totalCount = res.totalCounts;
        if (this.logSource.data.length === 0) {
          this.isEmpty = true;
        } else {
          this.isEmpty = false;
        }
        this.showPrivacyUi.emit(false);
      }
    });
  }
  goDetail(fileId) {
    if (this.isPortal) {
      return this.router.navigateByUrl(`/activity/${fileId}`);
    }
    this.router.navigateByUrl(`/dashboard/activity/${fileId}`);
  }
}
