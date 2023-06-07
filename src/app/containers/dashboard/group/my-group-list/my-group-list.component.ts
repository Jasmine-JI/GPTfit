import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatPaginator, PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { AuthService, HashIdService, Api11xxService } from '../../../../core/services';
import { getUrlQueryStrings } from '../../../../core/utils';
import { appPath } from '../../../../app-path.const';
import { QueryString } from '../../../../core/enums/common';
import { AccessNamePipe } from '../../../../core/pipes/access-name.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgIf } from '@angular/common';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-my-group-list',
  templateUrl: './my-group-list.component.html',
  styleUrls: ['./my-group-list.component.scss', '../group-style.scss'],
  standalone: true,
  imports: [
    RouterLink,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatTableModule,
    MatSortModule,
    NgIf,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    TranslateModule,
    AccessNamePipe,
  ],
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

  readonly searchGroupLink = `/${appPath.dashboard.home}/${appPath.professional.groupSearch}`;

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
      const { dashboard, professional } = appPath;
      const pageIndex = this.currentPage.pageIndex + 1;
      this.currentPage = page;
      this.router.navigateByUrl(
        `/${dashboard.home}/${professional.myGroupList}?${QueryString.pageNumber}=${pageIndex}`
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
      this.isEmpty = this.logSource.data.length === 0;
    });
  }

  goDetail(groupId) {
    const hashGroupId = this.hashIdService.handleGroupIdEncode(groupId);
    const { dashboard, professional } = appPath;
    this.router.navigateByUrl(`${dashboard.home}/${professional.groupDetail.home}/${hashGroupId}`);
  }
  selectTarget(_value) {
    this.selectedValue = encodeURIComponent(_value).trim();
  }
}
