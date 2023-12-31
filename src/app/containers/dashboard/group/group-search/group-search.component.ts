import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { AuthService, HashIdService, Api11xxService } from '../../../../core/services';
import { getUrlQueryStrings } from '../../../../core/utils';
import { appPath } from '../../../../app-path.const';
import { QueryString } from '../../../../core/enums/common';
import { GroupStatusPipe } from '../../../../core/pipes/group-status.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-group-search',
  templateUrl: './group-search.component.html',
  styleUrls: ['./group-search.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    RouterLink,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatAutocompleteModule,
    FormsModule,
    NgFor,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    NgIf,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    TranslateModule,
    GroupStatusPipe,
  ],
})
export class GroupSearchComponent implements OnInit {
  groupLevel = '130';
  searchWords: string | string[];
  token: string;
  logSource = new MatTableDataSource<any>();
  totalCount: number;
  currentPage: PageEvent;
  currentSort: Sort;
  infoOptions: any;
  selectedValue = '';
  isEmpty = true;
  isLoading = false;

  @ViewChild('paginator', { static: true })
  paginator: MatPaginator;
  @ViewChild('sortTable', { static: false })
  sortTable: MatSort;
  @ViewChild('filter', { static: false })
  filter: ElementRef;

  readonly backUrl = `/${appPath.dashboard.home}/${appPath.professional.myGroupList}`;

  constructor(
    private api11xxService: Api11xxService,
    private router: Router,
    private hashIdService: HashIdService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const queryStrings = getUrlQueryStrings(location.search);
    const { pageNumber, searchWords, groupLevel } = queryStrings;

    this.searchWords = searchWords || '';

    this.currentPage = {
      pageIndex: +pageNumber - 1 || 0,
      pageSize: 10,
      length: null,
    };
    this.token = this.authService.token;
    // 分頁切換時，重新取得資料
    this.paginator.page.subscribe((page: PageEvent) => {
      this.currentPage = page;
      this.getLists('changePage');
    });
  }

  getLists(act) {
    const brandType = this.groupLevel.slice(0, 1),
      level = this.groupLevel.slice(1, 3);

    if (act === 'submit') {
      this.currentPage.pageIndex = 0;
    }

    const body = {
      token: this.token,
      brandType: brandType,
      category: '3',
      groupLevel: level || '30',
      searchWords: this.searchWords || '',
      page: (this.currentPage && this.currentPage.pageIndex.toString()) || '0', // 修復點選下一頁清單卻沒有改變的問題-kidin-1081205(Bug 956)
      pageCounts: (this.currentPage && this.currentPage.pageSize.toString()) || '10', // 修復每頁顯示項數失效的問題-kidin-1081205(Bug 956)
    };

    if (this.searchWords && this.searchWords.length > 0) {
      this.isLoading = true;
      this.api11xxService.fetchGroupList(body).subscribe((res) => {
        this.isLoading = false;
        this.logSource.data = res.info.groupList;
        this.totalCount = res.info.totalCounts;
        this.isEmpty = this.logSource.data.length === 0;
        const { dashboard, professional } = appPath;
        const { pageNumber, searchWords, groupLevel } = QueryString;
        const pathName = `/${dashboard.home}/${professional.groupSearch}`;
        const query = `?${pageNumber}=${this.currentPage.pageIndex + 1}&${searchWords}=${(
          this.searchWords as string
        ).trim()}&${groupLevel}=${this.groupLevel}`;
        this.router.navigateByUrl(pathName + query);
      });
    }
  }

  goDetail(groupId) {
    const { dashboard, professional } = appPath;
    const hashGroupId = this.hashIdService.handleGroupIdEncode(groupId);
    this.router.navigateByUrl(`${dashboard.home}/${professional.groupDetail.home}/${hashGroupId}`);
  }
}
