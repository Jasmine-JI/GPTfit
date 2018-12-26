import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ViewEncapsulation
} from '@angular/core';
import { GroupService } from '../../services/group.service';
import {
  MatTableDataSource,
  MatPaginator,
  PageEvent,
  MatSort,
  Sort,
  MatPaginatorIntl
} from '@angular/material';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/fromEvent';
import { Router } from '@angular/router';
import { UtilsService } from '@shared/services/utils.service';

@Component({
  selector: 'app-group-search',
  templateUrl: './group-search.component.html',
  styleUrls: ['./group-search.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class GroupSearchComponent implements OnInit {
  // to fixed
  groupLevel: any; //  Type 'string | string[]' is not assignable to type 'string'.  所以暫時先用any，之後找原因
  searchWords: any; //  Type 'string | string[]' is not assignable to type 'string'.  所以暫時先用any，之後找原因
  token: string;
  logSource = new MatTableDataSource<any>();
  totalCount: number;
  currentPage: PageEvent;
  currentSort: Sort;
  infoOptions: any;
  selectedValue = '';
  isEmpty = true;
  isLoading = false;
  @ViewChild('paginator')
  paginator: MatPaginator;
  @ViewChild('sortTable')
  sortTable: MatSort;
  @ViewChild('filter')
  filter: ElementRef;
  constructor(
    private groupService: GroupService,
    private matPaginatorIntl: MatPaginatorIntl,
    private router: Router,
    private utils: UtilsService
  ) {}

  ngOnInit() {
    const queryStrings = this.utils.getUrlQueryStrings(location.search);
    const { pageNumber, searchWords, groupLevel } = queryStrings;

    this.searchWords = searchWords || '';
    this.groupLevel = groupLevel || '30';

    this.currentPage = {
      pageIndex: +pageNumber - 1 || 0,
      pageSize: 10,
      length: null
    };
    this.token = this.utils.getToken();
    this.getLists();
    // 分頁切換時，重新取得資料
    this.paginator.page.subscribe((page: PageEvent) => {
      this.currentPage = page;
      this.getLists();
    });
  }
  getLists() {
    const body = {
      token: this.token,
      category: '3',
      groupLevel: this.groupLevel || '30',
      searchWords: this.searchWords || '',
      page: '0',
      pageCounts: '10'
    };
    if (this.searchWords && this.searchWords.length > 0) {
      this.isLoading = true;
      this.groupService.fetchGroupList(body).subscribe(res => {
        this.isLoading = false;
        this.logSource.data = res.info.groupList;
        this.totalCount = res.info.totalCounts;
        if (this.logSource.data.length === 0) {
          this.isEmpty = true;
        } else {
          this.isEmpty = false;
        }
        const url = '/dashboard/group-search?' +
        `pageNumber=${this.currentPage.pageIndex + 1}&searchWords=${this.searchWords.trim()}`
        + `&groupLevel=${this.groupLevel}`;
        this.router.navigateByUrl(url);
      });
    }
  }
  goDetail(groupId) {
    this.router.navigateByUrl(`dashboard/group-info/${groupId}`);
  }
}
