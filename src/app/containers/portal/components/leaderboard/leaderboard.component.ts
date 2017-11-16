import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import debounce from 'debounce';
import queryString from 'query-string';
import { cloneDeep } from 'lodash';

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
  isHaveEmail: boolean;
  email: string;
  active = false;
  isSelectLoading = false;
  public element: ElementRef;
  tempEmail: string;
  emailOptions: any;
  isFoundUser = false;
  bgImageUrl: string;
  bgIdx = 0;
  mapImages = [
    '/assets/images/Tour_Eiffel_1080.jpg',
    '/assets/images/Olympiapark_Munchen_1080.jpg',
    '/assets/images/Ju-Yong_customs_1080.jpg',
    '/assets/images/Airolo_1080.jpg',
    '/assets/images/Panathenean_Stadium_1080.jpg'
  ];
  EMPTY_OBJECT = {};

  constructor(private http: HttpClient, private router: Router) {
    this.handleSearchEmail = debounce(this.handleSearchEmail, 1000);

    this.bgImageUrl = `url(${this.mapImages[this.bgIdx]})`;
  }
  @HostListener('document:click')
  close() {
    this.active = false;
  }
  ngOnInit() {
    const queryStrings = this.getUrlQueryStrings(location.search);
    let params = new HttpParams();
    params = params.append('param', 'map');
    if (!this.isObjectEmpty(queryStrings)) {
      const { pageNumber, month, mapId } = queryStrings;
      if (pageNumber) {
        params = params.append('pageNumber', pageNumber);
      }
      if (month) {
        this.month = month;
        params = params.append('month', month);
      }
      if (mapId) {
        this.mapId = mapId;
        params = params.append('mapId', mapId);
      }
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
    const { email, mapId, groupId, month } = form.value;
    this.email = email;
    this.isFoundUser = this.email ? true : false;
    this.mapId = mapId;
    this.bgIdx = this.mapId - 1;
    this.bgImageUrl = `url(${this.mapImages[this.bgIdx]})`;
    this.groupId = groupId;
    this.month = month;
    let params = new HttpParams();
    params = params.append('mapId', this.mapId.toString());
    params = params.append('month', month);
    this.isHaveEmail = email ? true : false;
    if (this.groupId !== '3') {
      params = params.append('gender', this.groupId);
    }
    if (email) {
      params = params.append('email', email.trim());
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
        this.toHistoryPrePage();
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
        this.toHistoryPrePage();
      });
  }
  toHistoryPrePage() {
    const paramDatas = {
      pageNumber: this.meta.currentPage,
      month: this.month,
      mapId: this.mapId
    };
    this.router.navigateByUrl(
      `${location.pathname}?${this.buildUrlQueryStrings(paramDatas)}`
    );
  }
  toMapInfoPage(userId) {

    const paramDatas = {
      month: this.month,
      mapId: this.mapId,
      userId
    };
    this.router.navigateByUrl(
      `${location.pathname}/mapInfo?${this.buildUrlQueryStrings(paramDatas)}`
    );
  }
  prePage() {
    const pageNumber = this.meta.currentPage - 1;
    let params = new HttpParams();
    params = params.append('mapId', this.mapId.toString());
    params = params.append('pageNumber', pageNumber.toString());
    params = params.append('month', this.month);
    if (this.groupId !== '3') {
      params = params.append('gender', this.groupId);
    }
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
        this.toHistoryPrePage();
      });
  }
  nextPage() {
    const pageNumber = this.meta.currentPage + 1;
    let params = new HttpParams();
    params = params.append('mapId', this.mapId.toString());
    params = params.append('pageNumber', pageNumber);
    params = params.append('month', this.month);
    if (this.groupId !== '3') {
      params = params.append('gender', this.groupId);
    }
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
        this.toHistoryPrePage();
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
        this.toHistoryPrePage();
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
        this.toHistoryPrePage();
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
  preMap() {
    if (this.bgIdx - 1 < 0) {
      this.bgIdx = this.mapImages.length - 1;
    } else {
      this.bgIdx = this.bgIdx - 1;
    }
    if (this.mapId - 1 === 0) {
      this.mapId = this.mapDatas.length;
    } else {
      this.mapId = this.mapId - 1;
    }
    this.bgImageUrl = `url(${this.mapImages[this.bgIdx]})`;
    let params = new HttpParams();
    params = params.append('mapId', this.mapId.toString());
    params = params.append('month', this.month);
    if (this.groupId !== '3') {
      params = params.append('gender', this.groupId);
    }
    if (this.email) {
      params = params.append('email', this.email.trim());
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
        this.pageRanges = Array.from(
          { length: this.meta.maxPage },
          (v, k) => k + 1
        );
        this.toHistoryPrePage();
      });
  }
  nextMap() {
    if (this.bgIdx + 1 > 4) {
      this.bgIdx = 0;
    } else {
      this.bgIdx = this.bgIdx + 1;
    }
    if (this.mapId + 1 > this.mapDatas.length) {
      this.mapId = 1;
    } else {
      this.mapId = this.mapId + 1;
    }
    this.bgImageUrl = `url(${this.mapImages[this.bgIdx]})`;
    let params = new HttpParams();
    params = params.append('mapId', this.mapId.toString());
    params = params.append('month', this.month);
    if (this.groupId !== '3') {
      params = params.append('gender', this.groupId);
    }
    if (this.email) {
      params = params.append('email', this.email.trim());
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
        this.pageRanges = Array.from(
          { length: this.meta.maxPage },
          (v, k) => k + 1
        );
        this.toHistoryPrePage();
      });
  }
  buildUrlQueryStrings(_params) {
    const params = this.isObjectEmpty(_params)
      ? this.EMPTY_OBJECT
      : cloneDeep(_params);
    if (Object.keys(params).length) {
      for (const key in params) {
        if (!params[key]) {
          delete params[key];
        }
      }
    }
    return queryString.stringify(params);
  }
  isObjectEmpty(object) {
    if (!object) {
      return true;
    }
    return Object.keys(object).length === 0 && object.constructor === Object;
  }

  getUrlQueryStrings(_search) {
    const search = _search || window.location.search;
    if (!search) {
      return this.EMPTY_OBJECT;
    }
    return queryString.parse(search);
  }
}
