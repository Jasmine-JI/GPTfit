import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { GroupService } from '../../services/group.service';
import {
  MatTableDataSource,
  MatPaginator,
  PageEvent,
  MatSort,
  Sort
} from '@angular/material';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/fromEvent';
import { Router } from '@angular/router';
import { UtilsService } from '@shared/services/utils.service';
import { HashIdService } from '@shared/services/hash-id.service';

@Component({
  selector: 'app-all-group-list',
  templateUrl: './all-group-list.component.html',
  styleUrls: ['./all-group-list.component.scss', '../group-style.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AllGroupListComponent implements OnInit {
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
  @ViewChild('paginator') paginator: MatPaginator;
  @ViewChild('sortTable') sortTable: MatSort;
  @ViewChild('filter') filter: ElementRef;
  constructor(
    private groupService: GroupService,
    private router: Router,
    private utils: UtilsService,
    private hashIdService: HashIdService
  ) {}

  ngOnInit() {
    const queryStrings = this.utils.getUrlQueryStrings(location.search);
    const { pageNumber } = queryStrings;
    this.token = this.utils.getToken() || '';
    this.currentPage = {
      pageIndex: +pageNumber - 1 || 0,
      pageSize: 10,
      length: null
    };
    this.getLists();
    // 分頁切換時，重新取得資料
    this.paginator.page.subscribe((page: PageEvent) => {
      this.currentPage = page;
      this.router.navigateByUrl(
        `/dashboard/system/all-group-list?pageNumber=${this.currentPage
          .pageIndex + 1}`
      );
      this.getLists();
    });
  }

  getLists() {
    this.isLoading = true;
    const brandType = this.groupLevel.slice(0, 1),
          level = this.groupLevel.slice(1, 3);

    const body = {
      token: this.token,
      brandType: brandType,
      category: '1',
      groupLevel: level,
      searchWords: this.searchWords,
      page: (this.currentPage && this.currentPage.pageIndex.toString()) || '0',
      pageCounts:
        (this.currentPage && this.currentPage.pageSize.toString()) || '10'
    };
    if (this.groupLevel !== '00' || this.searchWords.length > 0) {
      body.category = '3';
    }
    this.groupService.fetchGroupList(body).subscribe(res => {
      this.logSource.data = res.info.groupList;
      this.totalCount = res.info.totalCounts;
      this.isLoading = false;
    });
  }
  goDetail(groupId) {
    this.router.navigateByUrl(`dashboard/group-info/${this.hashIdService.handleGroupIdEncode(groupId)}`);
  }
}
