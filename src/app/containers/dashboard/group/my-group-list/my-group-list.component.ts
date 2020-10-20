import {
  Component,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { GroupService } from '../../services/group.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/fromEvent';
import { Router } from '@angular/router';
import { UtilsService } from '@shared/services/utils.service';
import { HashIdService } from '@shared/services/hash-id.service';

@Component({
  selector: 'app-my-group-list',
  templateUrl: './my-group-list.component.html',
  styleUrls: ['./my-group-list.component.scss', '../group-style.scss']
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
  @ViewChild('paginator', {static: true}) paginator: MatPaginator;
  @ViewChild('sortTable', {static: false}) sortTable: MatSort;
  @ViewChild('filter', {static: false}) filter: ElementRef;

  constructor(
    private groupService: GroupService,
    private router: Router,
    private utils: UtilsService,
    private hashIdService: HashIdService
  ) {
  }

  ngOnInit() {
    const queryStrings = this.utils.getUrlQueryStrings(location.search);
    const { pageNumber } = queryStrings;

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
      pageCounts:
        (this.currentPage && this.currentPage.pageSize.toString()) || '10'
    };
    this.groupService.fetchGroupList(body).subscribe(res => {
      this.isLoading = false;
      this.logSource.data = res.info.groupList.filter(
        _group => _group.groupStatus !== 4 && _group.joinStatus === 2
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
    this.router.navigateByUrl(`dashboard/group-info/${this.hashIdService.handleGroupIdEncode(groupId)}`);
  }
  selectTarget(_value) {
    this.selectedValue = encodeURIComponent(_value).trim();
  }
}
