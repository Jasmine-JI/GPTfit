import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import debounce from 'debounce';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css']
})
export class LeaderboardComponent implements OnInit {
  rankDatas: Array<any>;
  monthDatas: any;
  mapDatas: any;
  response: any;
  mapId = 5;
  month = '11';
  meta: any;
  pageRanges: Array<any>;
  isFirstPage: boolean;
  isLastPage: boolean;
  isHaveDatas: boolean;
  searchedUserId: number;
  groupId = '3';
  isHaveUserId: boolean;
  isHaveEmail: boolean;
  email: string;
  active = false;
  isSelectLoading = false;
  public element: ElementRef;
  tempEmail: string;
  emailOptions: any;
  isFoundUser = false;

  constructor(private http: HttpClient) {
    this.handleSearchEmail = debounce(this.handleSearchEmail, 1000);
  }
  @HostListener('document:click')
  close() {
    this.active = false;
  }
  ngOnInit() {
    let params = new HttpParams();
    params = params.append('param', 'map');
    this.http.get('http://192.168.1.235:3000/rankform').subscribe(res => {
      this.response = res;
      const { datas, meta } = this.response;
      this.rankDatas = datas;
      this.meta = this.buildPageMeta(meta);
      this.isFirstPage = this.meta.currentPage === 1;
      this.isLastPage = this.meta.currentPage === this.meta.maxPage;
      this.isHaveDatas = this.rankDatas.length > 0;
      this.pageRanges = Array.from(
        { length: this.meta.maxPage },
        (v, k) => k + 1
      );
    });
    this.http
      .get('http://192.168.1.235:3000/rankform/rankInfo', { params })
      .subscribe(res => {
        this.mapDatas = res;
      });
    this.http
      .get('http://192.168.1.235:3000/rankform/rankInfo/month')
      .subscribe(res => {
        this.monthDatas = res;
      });
  }
  onSubmit(form, event: any) {
    event.stopPropagation();
    const { email, mapId, groupId, userId, month } = form.value;
    this.email = email;
    this.isFoundUser = this.email ? true : false;
    this.mapId = mapId;
    this.groupId = groupId;
    this.month = month;
    let params = new HttpParams();
    params = params.append('mapId', this.mapId.toString());
    params = params.append('month', month);
    this.isHaveUserId = userId ? true : false;
    this.isHaveEmail = email ? true : false;
    if (this.groupId !== '3') {
      params = params.append('gender', this.groupId);
    }
    if (email) {
      params = params.append('email', email.trim());
    }
    if (userId) {
      params = params.append('userId', (userId && userId.toString()) || null);
    }
    this.http
      .get('http://192.168.1.235:3000/rankform', { params })
      .subscribe(res => {
        this.response = res;
        const { datas, meta } = this.response;
        this.rankDatas = datas;
        this.meta = this.buildPageMeta(meta);
        this.isFirstPage = this.meta.currentPage === 1;
        this.isLastPage = this.meta.currentPage === this.meta.maxPage;
        this.isHaveDatas = this.rankDatas.length > 0;
        this.email = email && email.trim();
        this.pageRanges = Array.from(
          { length: this.meta.maxPage },
          (v, k) => k + 1
        );
      });
  }
  buildPageMeta(_meta) {
    const meta = Object.assign(
      {},
      {
        pageNumber: 0,
        pageSize: 0,
        pageCount: 0
      },
      _meta
    );
    const { pageSize, pageCount } = meta;
    const maxPage = Math.ceil(pageCount / pageSize) || 0;
    return {
      maxPage,
      currentPage: meta.pageNumber,
      perPage: pageSize,
      total: pageCount
    };
  }
  selectPage(pageNumber) {
    let params = new HttpParams();
    params = params.append('mapId', this.mapId.toString());
    params = params.append('pageNumber', pageNumber.toString());
    this.http
      .get(`http://192.168.1.235:3000/rankform`, { params })
      .subscribe(res => {
        this.response = res;
        const { datas, meta } = this.response;
        this.rankDatas = datas;
        this.meta = this.buildPageMeta(meta);
        this.isFirstPage = this.meta.currentPage === 1;
        this.isLastPage = this.meta.currentPage === this.meta.maxPage;
      });
  }
  prePage() {
    const pageNumber = this.meta.currentPage - 1;
    let params = new HttpParams();
    params = params.append('mapId', this.mapId.toString());
    params = params.append('pageNumber', pageNumber.toString());
    this.http
      .get(`http://192.168.1.235:3000/rankform`, { params })
      .subscribe(res => {
        this.response = res;
        const { datas, meta } = this.response;
        this.rankDatas = datas;
        this.meta = this.buildPageMeta(meta);
        this.isFirstPage = pageNumber === 1;
        this.isLastPage = this.meta.currentPage === this.meta.maxPage;
        this.isHaveDatas = this.rankDatas.length > 0;
      });
  }
  nextPage() {
    const pageNumber = this.meta.currentPage + 1;
    let params = new HttpParams();
    params = params.append('mapId', this.mapId.toString());
    params = params.append('pageNumber', pageNumber);
    this.http
      .get(`http://192.168.1.235:3000/rankform`, { params })
      .subscribe(res => {
        this.response = res;
        const { datas, meta } = this.response;
        this.rankDatas = datas;
        this.meta = this.buildPageMeta(meta);
        this.isFirstPage = this.meta.currentPage === 1;
        this.isLastPage = this.meta.currentPage === this.meta.maxPage;
        this.isHaveDatas = this.rankDatas.length > 0;
      });
  }
  toFirstPage() {
    let params = new HttpParams();
    params = params.append('mapId', this.mapId.toString());
    params = params.append('pageNumber', '1');

    this.http
      .get(`http://192.168.1.235:3000/rankform`, { params })
      .subscribe(res => {
        this.response = res;
        const { datas, meta } = this.response;
        this.rankDatas = datas;
        this.meta = this.buildPageMeta(meta);
        this.isFirstPage = this.meta.currentPage === 1;
        this.isLastPage = this.meta.currentPage === this.meta.maxPage;
        this.isHaveDatas = this.rankDatas.length > 0;
      });
  }
  toLastPage() {
    const { maxPage } = this.meta;
    let params = new HttpParams();
    params = params.append('mapId', this.mapId.toString());
    params = params.append('pageNumber', maxPage);

    this.http
      .get(`http://192.168.1.235:3000/rankform`, { params })
      .subscribe(res => {
        this.response = res;
        const { datas, meta } = this.response;
        this.rankDatas = datas;
        this.meta = this.buildPageMeta(meta);
        this.isFirstPage = this.meta.currentPage === 1;
        this.isLastPage = this.meta.currentPage === this.meta.maxPage;
        this.isHaveDatas = this.rankDatas.length > 0;
      });
  }
  public inputEvent(e: any, isUpMode: boolean = false): void {
    this.handleSearchEmail();
  }
  handleSearchEmail() {
    this.isSelectLoading = true;
    let params = new HttpParams();
    params = params.append('mapId', this.mapId.toString());
    params = params.append('month', this.month);
    params = params.append('keyword', this.email);
    this.http
      .get('http://192.168.1.235:3000/rankform/rankInfo/email', { params })
      .subscribe(res => {
        this.emailOptions = res;
        this.isSelectLoading = false;
      });
  }
  openActive(event: any) {
    event.stopPropagation();
    this.active = !this.active;
  }
  closeActive(event: any) {
    event.stopPropagation();
    this.active = false;
  }
  remove(index: number, event?: any): void {
    if (this.email && this.emailOptions.length > 1) {
      this.emailOptions.push(this.tempEmail);
    }
    this.email = this.emailOptions[index];
    if (this.emailOptions.length > 1) {
      this.tempEmail = this.emailOptions.splice(index, 1).toString();
    }
  }
}
