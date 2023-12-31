import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
  OnDestroy,
} from '@angular/core';
import { MatPaginator, PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { AuthService, HashIdService, Api11xxService } from '../../../../core/services';
import { getUrlQueryStrings, getPartGroupId } from '../../../../core/utils';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
  selector: 'app-all-group-list',
  templateUrl: './all-group-list.component.html',
  styleUrls: ['./all-group-list.component.scss', '../group-style.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
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
export class AllGroupListComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  groupLevel = '300';
  searchWords = '';
  token: string;
  logSource = new MatTableDataSource<any>();
  totalCount: number;
  currentPage: PageEvent;
  currentSort: Sort;
  infoOptions: any;
  selectedValue = '';
  isLoading = false;

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
    this.token = this.authService.token;
    this.currentPage = {
      pageIndex: +pageNumber - 1 || 0,
      pageSize: 10,
      length: null,
    };
    this.getLists('changePage');
    this.subscribePaginator();
  }

  /**
   * 訂閱分頁變更事件，並重新取得資料
   */
  subscribePaginator() {
    this.paginator.page.pipe(takeUntil(this.ngUnsubscribe)).subscribe((page: PageEvent) => {
      const {
        dashboard,
        adminManage: { home: adminManageHome, allGroupList },
      } = appPath;
      this.currentPage = page;
      this.router.navigateByUrl(
        `/${dashboard.home}/${adminManageHome}/${allGroupList}?${QueryString.pageNumber}=${
          this.currentPage.pageIndex + 1
        }`
      );
      this.getLists('changePage');
    });
  }

  getLists(act) {
    this.isLoading = true;
    const brandType = this.groupLevel.slice(0, 1),
      level = this.groupLevel.slice(1, 3);

    if (act === 'submit') {
      this.currentPage.pageIndex = 0;
    }

    const body = {
      token: this.token,
      brandType: brandType,
      category: '1',
      groupLevel: level,
      searchWords: this.searchWords,
      page: (this.currentPage && this.currentPage.pageIndex.toString()) || '0',
      pageCounts: (this.currentPage && this.currentPage.pageSize.toString()) || '10',
    };
    if (this.groupLevel !== '00' || this.searchWords.length > 0) {
      body.category = '3';
    }
    this.api11xxService.fetchGroupList(body).subscribe((res) => {
      this.logSource.data = res.info.groupList;
      this.totalCount = res.info.totalCounts;
      this.isLoading = false;
    });
  }

  goDetail(groupId) {
    const { dashboard, professional } = appPath;
    const hashGroupId = this.hashIdService.handleGroupIdEncode(groupId);
    this.router.navigateByUrl(`${dashboard.home}/${professional.groupDetail.home}/${hashGroupId}`);
  }

  /**
   * 顯示群組編碼
   * @param groupId {string}-群組id
   */
  displayGroupId(groupId: string) {
    return getPartGroupId(groupId, { start: 2, end: 5 });
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
