import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {
  MatLegacyPaginator as MatPaginator,
  LegacyPageEvent as PageEvent,
} from '@angular/material/legacy-paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { Router } from '@angular/router';
import { AuthService, HashIdService, Api11xxService } from '../../../../core/services';
import { getUrlQueryStrings } from '../../../../core/utils/index';

@Component({
  selector: 'app-my-group-list',
  templateUrl: './my-group-list.component.html',
  styleUrls: ['./my-group-list.component.scss', '../group-style.scss'],
})
export class MyGroupListComponent implements OnInit {
  logSource = new MatTableDataSource<any>();
  totalCount: number;
  currentPage: PageEvent;
  currentSort: Sort;
  infoOptions: any;
  selectedValue = '';
  token: string;
  isEmpty = false;
  isLoading = false;
  brandType = 3;
  currentBrandType = 3;
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;
  @ViewChild('sortTable', { static: false }) sortTable: MatSort;
  @ViewChild('filter', { static: false }) filter: ElementRef;

  constructor(
    private api11xxService: Api11xxService,
    private router: Router,
    private hashIdService: HashIdService,
    private authService: AuthService
  ) {}

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
    this.token = this.authService.token;
    this.getLists();

    // 分頁切換時，重新取得資料
    this.paginator.page.subscribe((page: PageEvent) => {
      this.currentPage = page;
      this.router.navigateByUrl(
        `/dashboard/my-group-list?pageNumber=${this.currentPage.pageIndex + 1}`
      );
      this.getLists();
    });
  }

  getLists() {
    this.isLoading = true;

    // 切換群組類型就將頁碼切回第一頁(Bug 1207)-kidin-1090507
    if (this.brandType !== this.currentBrandType) {
      this.currentPage.pageIndex = 0;
      this.currentBrandType = this.brandType;
    }

    const body = {
      token: this.token,
      brandType: this.brandType,
      category: '2',
      groupLevel: '90', // 撈全部列表，後端不會檢查groupLevel欄位，所以值可以亂帶
      searchWords: '',
      page: (this.currentPage && this.currentPage.pageIndex.toString()) || '0',
      pageCounts: (this.currentPage && this.currentPage.pageSize.toString()) || '10',
    };
    this.api11xxService.fetchGroupList(body).subscribe((res) => {
      this.isLoading = false;
      this.logSource.data = res.info.groupList.filter(
        (_group) => _group.groupStatus !== 4 && _group.joinStatus === 2
      );
      this.totalCount = res.info.totalCounts;
      if (this.logSource.data.length === 0) {
        this.isEmpty = true;
      } else {
        this.isEmpty = false;
      }
    });
  }

  goDetail(groupId) {
    this.router.navigateByUrl(
      `dashboard/group-info/${this.hashIdService.handleGroupIdEncode(groupId)}`
    );
  }
  selectTarget(_value) {
    this.selectedValue = encodeURIComponent(_value).trim();
  }
}
