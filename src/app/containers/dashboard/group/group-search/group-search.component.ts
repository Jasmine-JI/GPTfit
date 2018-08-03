import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { GroupService } from '../../services/group.service';
import {
  MatTableDataSource,
  MatPaginator,
  PageEvent,
  MatSort,
  Sort,
  MatPaginatorIntl
} from '@angular/material';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/fromEvent';
import { Router } from '@angular/router';
import { debounce } from '@shared/utils/';
import { UtilsService } from '@shared/services/utils.service';

@Component({
  selector: 'app-group-search',
  templateUrl: './group-search.component.html',
  styleUrls: ['./group-search.component.css', '../group-style.css']
})
export class GroupSearchComponent implements OnInit {
  groupLevel = '90';
  searchWords = '';
  token: string;
  logSource = new MatTableDataSource<any>();
  totalCount: number;
  currentPage: PageEvent;
  currentSort: Sort;
  infoOptions: any;
  selectedValue = '';
  @ViewChild('paginator') paginator: MatPaginator;
  @ViewChild('sortTable') sortTable: MatSort;
  @ViewChild('filter') filter: ElementRef;
  constructor(
    private groupService: GroupService,
    private matPaginatorIntl: MatPaginatorIntl,
    private router: Router,
    private utils: UtilsService
  ) {}

  ngOnInit() {
    this.token = this.utils.getToken();
    this.getLists();
  }
  getLists() {
    const body = {
      token: this.token,
      category: '3',
      groupLevel: this.groupLevel,
      searchWords: this.searchWords,
      page: '0',
      pageCounts: '10'
    };
    if (this.searchWords.length > 0) {
      this.groupService
        .fetchGroupList(body)
        .subscribe(res => {
          this.logSource.data = res.info.groupList;
          this.totalCount = res.info.totalCounts;
        });
    }
  }
  goDetail(groupId) {
    this.router.navigateByUrl(`dashboard/group-info/${groupId}`);
  }
}
