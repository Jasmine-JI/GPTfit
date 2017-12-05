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
import { GlobalEventsManager } from '@shared/global-events-manager';
import { forkJoin } from 'rxjs/observable/forkJoin';

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
  month = (new Date().getMonth() + 1).toString();
  date =  0;
  dateData = [
    '2017-12-05',
    '2017-12-06'
  ];
  meta: any; // api回的meta資料
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
  currentPage: number;
  isClearIconShow = false;
  constructor(
    private router: Router,
    private rankFormService: RankFormService,
    private globalEventsManager: GlobalEventsManager
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
    params = params.set('param', 'map');
    if (!isObjectEmpty(queryStrings)) {
      const {
        pageNumber,
        month,
        mapId,
        groupId,
        date
      } = queryStrings;
      if (pageNumber) {
        params = params.set('pageNumber', pageNumber);
      }
      if (date) {
        this.date = date;
        const selectDate = this.dateData[this.date];
        params = params.set('date', selectDate);
      }
      if (month) {
        this.month = month;
        params = params.set('month', month);
      }
      if (mapId) {
        this.mapId = mapId;
        params = params.set('mapId', mapId);
      }
      if (groupId !== '3') {
        this.groupId = groupId;
        params = params.set('gender', groupId);
      }
    }
    this.bgImageUrl = `url(${mapImages[this.mapId - 1]})`; // 背景圖 ，預設為取雅典娜
    const fetchMapOptions = this.rankFormService.getMapOptions(params);

    // const fetchMonthsOptions = this.rankFormService.getMonths();

    forkJoin([fetchMapOptions]).subscribe(results => {
      this.mapDatas = results[0];
      this.mapName = this.mapDatas[this.mapId - 1].map_name;
      this.monthDatas = results[1];
      // if (this.monthDatas.findIndex(_month => _month.month === this.month) === -1) {
      //   const idx = this.monthDatas.length - 1;
      //   this.month = this.monthDatas[idx].month;
      //   // params = params.set('month', this.month);
      // }
      this.fetchRankForm(params);

      const { mapDatas, monthDatas } = this;
      const searchOptions = {
        mapDatas,
        monthDatas
      };
      this.globalEventsManager.getMapOptions(searchOptions);
      this.globalEventsManager.getMapId(this.mapId);
    });
    this.globalEventsManager.getRankFormEmitter.subscribe((res) => {
      this.response = res;
      if (res) {
        const {
          datas,
          email,
          meta
        } = this.response;
        this.rankDatas = datas;
        this.email = email;
        if (meta) {
          this.isHaveEmail = false;
          this.meta = buildPageMeta(meta);
        } else {
          this.isHaveEmail = true;
          this.isFoundUser = true;
        }
        if (this.rankDatas && this.rankDatas.length > 0) {
          this.isHaveDatas = true;
          this.mapId = datas[0].map_id;
          this.mapName = datas[0].map_name;
          // this.mapName = this.mapDatas[this.mapId - 1].map_name;
          this.distance = this.rankDatas.length > 0 && this.rankDatas[0].race_total_distance;
        } else {
          this.isHaveDatas = false;
        }
      }
    });
    this.globalEventsManager.showLoadingEmitter.subscribe((isLoading) => {
      this.isLoading = isLoading;
    });
  }
  onSubmit(form, event: any) {
    event.stopPropagation();
    const {
      email,
      mapId,
      groupId,
      // month,
      date
    } = form.value;
    this.email = email;
    this.isFoundUser = this.email ? true : false;
    this.mapId = mapId;
    this.mapName = this.mapDatas[this.mapId - 1].map_name;
    this.bgImageUrl = `url(${mapImages[this.mapId - 1]})`;
    this.groupId = groupId;
    // this.month = month;
    this.date = date;
    const selectDate = this.dateData[this.date];
    let params = new HttpParams();
    params = params.set('mapId', this.mapId.toString());
    // params = params.set('month', this.month);
    params = params.set('date', selectDate);
    this.isHaveEmail = email ? true : false;
    if (this.groupId !== '3') {
      params = params.set('gender', this.groupId);
    }
    if (email) {
      params = params.set('email', encodeURIComponent(email.trim()));
    }
    this.email = email && email.trim();
    this.fetchRankForm(params);
  }
  onPageChange(pageNumber) {
    this.currentPage = pageNumber;
    let params = new HttpParams();
    if (this.groupId !== '3') {
      params = params.set('gender', this.groupId);
    }
    if (this.email) {
      params = params.set('email', this.email.trim());
    }
    const selectDate = this.dateData[this.date];
    params = params.set('date', selectDate);
    // params = params.set('month', this.month);
    params = params.set('mapId', this.mapId.toString());
    params = params.set('pageNumber', this.currentPage.toString());
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
      this.toHistoryPrePage();
    });
  }

  toHistoryPrePage() {
    const paramDatas = {
      pageNumber: this.meta.currentPage,
      // month: this.month,
      date: this.date,
      mapId: this.mapId,
      groupId: this.groupId
    };
    this.router.navigateByUrl(
      `${location.pathname}?${buildUrlQueryStrings(paramDatas)}`
    );
  }
  toMapInfoPage(userId) {
    const paramDatas = {
      // month: this.month,
      date: this.date,
      mapId: this.mapId,
      userId,
    };
    this.router.navigateByUrl(
      `${location.pathname}/mapInfo?${buildUrlQueryStrings(paramDatas)}`
    );
  }

  public inputEvent(e: any, isUpMode: boolean = false): void {
    if (e.target.value.length > 0 && this.email) {
      this.isClearIconShow = true;
    } else {
      this.isClearIconShow = false;
    }
    this.handleSearchEmail();
  }
  public focusEvent(e: any, isUpMode: boolean = false): void {
    if (e.target.value.length > 0 && this.email) {
      this.isClearIconShow = true;
    } else {
      this.isClearIconShow = false;
    }
  }
  handleSearchEmail() {
    this.isSelectLoading = true;
    let params = new HttpParams();
    params = params.set('mapId', this.mapId.toString());
    // params = params.set('month', this.month);
    const selectDate = this.dateData[this.date];
    params = params.set('date', selectDate);
    params = params.set('keyword', this.email);
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
    params = params.set('mapId', this.mapId.toString());
    const selectDate = this.dateData[this.date];
    params = params.set('date', selectDate);
    // params = params.set('month', this.month);
    if (this.groupId !== '3') {
      params = params.set('gender', this.groupId);
    }
    if (this.email) {
      params = params.set('email', this.email.trim());
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
    params = params.set('mapId', this.mapId.toString());
    const selectDate = this.dateData[this.date];
    params = params.set('date', selectDate);
    // params = params.set('month', this.month);
    if (this.groupId !== '3') {
      params = params.set('gender', this.groupId);
    }
    if (this.email) {
      params = params.set('email', this.email.trim());
    }
    this.fetchRankForm(params);
  }
  selectMap(id) {
    this.globalEventsManager.getMapId(id);
  }
  clear() {
    this.email = '';
    this.isClearIconShow = false;
  }
}
