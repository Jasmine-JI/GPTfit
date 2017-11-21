import { Component, OnInit, HostListener } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import debounce from 'debounce';
import { RankFormService } from '../../services/rank-form.service';
import { mapImages } from '@shared/mapImages';
import {
  isObjectEmpty,
  buildUrlQueryStrings,
  getUrlQueryStrings,
  buildPageMeta
} from '@shared/utils/';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css']
})
export class LeaderboardComponent implements OnInit {
  rankDatas: Array<any>; // 排行板資料
  monthDatas: any; // 有資料的月份
  mapDatas: any; // 有資料的地圖
  response: any; // rankDatas 回的res載體
  mapId = 5; // 預設為雅典
  month = '11';
  meta: any; // api回的meta資料
  pageRanges: Array<any>; // 產生頁數範圍
  isFirstPage: boolean; // 是否為第一頁
  isLastPage: boolean; // 是否為最後一頁
  isHaveDatas: boolean; // 當前條件下的rankDatas有無資料
  groupId = '3'; // 組別 預設為無分組
  isHaveEmail: boolean; // 有無mail
  email: string;
  active = false; // select options的開關
  isSelectLoading = false; // select async loading開關
  tempEmail: string; // 存select上一筆被選的email
  emailOptions: any; // select async options
  isFoundUser = false; // 標記目標email
  bgImageUrl: string; // 背景圖
  distance: number; // 該地圖的距離資料

  mapName: string; // 該地圖名字
  isLoading = false;

  constructor(
    private router: Router,
    private rankFormService: RankFormService
  ) {
    this.handleSearchEmail = debounce(this.handleSearchEmail, 1000);
  }
  @HostListener('document:click')
  close() {
    this.active = false;
  }
  ngOnInit() {
    const queryStrings = getUrlQueryStrings(location.search);
    let params = new HttpParams();
    params = params.append('param', 'map');
    if (!isObjectEmpty(queryStrings)) {
      const {
        pageNumber,
        month,
        mapId
      } = queryStrings;
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
    this.bgImageUrl = `url(${mapImages[this.mapId - 1]})`; // 背景圖 ，預設為取雅典娜

    this.fetchRankForm(params);
    this.rankFormService.getMapOptions(params).subscribe(res => {
      this.mapDatas = res;
      this.mapName = this.mapDatas[this.mapId - 1].map_name;
    });
    this.rankFormService.getMonths().subscribe(res => {
      this.monthDatas = res;
    });
  }
  onSubmit(form, event: any) {
    event.stopPropagation();
    const {
      email,
      mapId,
      groupId,
      month
    } = form.value;
    this.email = email;
    this.isFoundUser = this.email ? true : false;
    this.mapId = mapId;
    this.mapName = this.mapDatas[this.mapId - 1].map_name;
    this.bgImageUrl = `url(${mapImages[this.mapId - 1]})`;
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
    this.email = email && email.trim();
    this.fetchRankForm(params);
  }
  fetchRankForm(params) {
    this.isLoading = true;
    this.rankFormService.getRank(params).subscribe(res => {
      this.isLoading = false;
      this.response = res;
      const { datas, meta } = this.response;
      this.rankDatas = datas;
      this.distance = this.rankDatas.length > 0 && this.rankDatas[0].race_total_distance;
      this.meta = buildPageMeta(meta);
      const { currentPage, maxPage } = this.meta;
      this.isFirstPage = currentPage === 1;
      this.isLastPage = currentPage === maxPage;
      this.isHaveDatas = this.rankDatas.length > 0;
      this.pageRanges = Array.from({ length: maxPage }, (v, k) => k + 1);
      this.toHistoryPrePage();
    });
  }

  selectPage(pageNumber) {
    let params = new HttpParams();
    params = params.append('mapId', this.mapId.toString());
    params = params.append('pageNumber', pageNumber.toString());
    this.fetchRankForm(params);
  }
  toHistoryPrePage() {
    const paramDatas = {
      pageNumber: this.meta.currentPage,
      month: this.month,
      mapId: this.mapId
    };
    this.router.navigateByUrl(
      `${location.pathname}?${buildUrlQueryStrings(paramDatas)}`
    );
  }
  toMapInfoPage(userId) {
    const paramDatas = {
      month: this.month,
      mapId: this.mapId,
      userId
    };
    this.router.navigateByUrl(
      `${location.pathname}/mapInfo?${buildUrlQueryStrings(paramDatas)}`
    );
  }
  prePage() {
    let params = new HttpParams();
    params = params.append('mapId', this.mapId.toString());
    params = params.append('month', this.month);
    if (this.meta.currentPage > 1) {
      const pageNumber = this.meta.currentPage - 1;
      params = params.append('pageNumber', pageNumber.toString());
    } else {
      return;
    }

    if (this.groupId !== '3') {
      params = params.append('gender', this.groupId);
    }
    this.fetchRankForm(params);
  }
  nextPage() {
    let params = new HttpParams();
    params = params.append('mapId', this.mapId.toString());
    params = params.append('month', this.month);
    if (this.meta.currentPage < this.meta.maxPage) {
      const pageNumber = this.meta.currentPage + 1;
      params = params.append('pageNumber', pageNumber);
    } else {
      return;
    }

    if (this.groupId !== '3') {
      params = params.append('gender', this.groupId);
    }
    this.fetchRankForm(params);
  }
  toFirstPage() {
    let params = new HttpParams();
    params = params.append('mapId', this.mapId.toString());
    params = params.append('pageNumber', '1');

    this.fetchRankForm(params);
  }
  toLastPage() {
    const { maxPage } = this.meta;
    let params = new HttpParams();
    params = params.append('mapId', this.mapId.toString());
    params = params.append('pageNumber', maxPage);

    this.fetchRankForm(params);
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
    this.rankFormService.getEmail(params).subscribe(res => {
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
    if (this.mapId - 1 === 0) {
      this.mapId = this.mapDatas.length;
    } else {
      this.mapId = this.mapId - 1;
    }
    this.mapName = this.mapDatas[this.mapId - 1].map_name;

    this.bgImageUrl = `url(${mapImages[this.mapId - 1]})`;
    let params = new HttpParams();
    params = params.append('mapId', this.mapId.toString());
    params = params.append('month', this.month);
    if (this.groupId !== '3') {
      params = params.append('gender', this.groupId);
    }
    if (this.email) {
      params = params.append('email', this.email.trim());
    }
    this.fetchRankForm(params);
  }
  nextMap() {
    if (this.mapId + 1 > this.mapDatas.length) {
      this.mapId = 1;
    } else {
      this.mapId = this.mapId + 1;
    }
    this.mapName = this.mapDatas[this.mapId - 1].map_name;
    this.bgImageUrl = `url(${mapImages[this.mapId - 1]})`;
    let params = new HttpParams();
    params = params.append('mapId', this.mapId.toString());
    params = params.append('month', this.month);
    if (this.groupId !== '3') {
      params = params.append('gender', this.groupId);
    }
    if (this.email) {
      params = params.append('email', this.email.trim());
    }
    this.fetchRankForm(params);
  }

}
