import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { GroupService } from '../../../../shared/services/group.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { HashIdService } from '../../../../shared/services/hash-id.service';
import { getUrlQueryStrings } from '../../../../shared/utils/index';

@Component({
  selector: 'app-group-search',
  templateUrl: './group-search.component.html',
  styleUrls: ['./group-search.component.scss'],
  encapsulation: ViewEncapsulation.None,
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

  constructor(
    private groupService: GroupService,
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
      this.groupService.fetchGroupList(body).subscribe((res) => {
        this.isLoading = false;
        this.logSource.data = res.info.groupList;
        this.totalCount = res.info.totalCounts;
        if (this.logSource.data.length === 0) {
          this.isEmpty = true;
        } else {
          this.isEmpty = false;
        }
        const url =
          '/dashboard/group-search?' +
          `pageNumber=${this.currentPage.pageIndex + 1}&searchWords=${(
            this.searchWords as string
          ).trim()}` +
          `&groupLevel=${this.groupLevel}`;
        this.router.navigateByUrl(url);
      });
    }
  }
  goDetail(groupId) {
    this.router.navigateByUrl(
      `dashboard/group-info/${this.hashIdService.handleGroupIdEncode(groupId)}`
    );
  }
}
