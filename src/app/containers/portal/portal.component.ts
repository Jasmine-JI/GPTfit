import { Component, OnInit, HostListener } from '@angular/core';
import { GlobalEventsManager } from '@shared/global-events-manager';
import debounce from 'debounce';
import { HttpParams } from '@angular/common/http';
import { RankFormService } from './services/rank-form.service';
import {
  buildUrlQueryStrings,
  buildPageMeta
} from '@shared/utils/';
import { Router } from '@angular/router';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'portal',
  templateUrl: './portal.component.html',
  styleUrls: ['./portal.component.css']
})
export class PortalComponent implements OnInit {
  isMaskShow = false;
  isCollapseOpen = false;
  mapDatas = [];
  mapId = 5;
  monthDatas = [];
  groupId = '3';
  month = (new Date().getMonth() + 1).toString();
  email: string;
  isFoundUser = false; // 標記目標email
  mapName: string; // 該地圖名字
  isHaveEmail: boolean; // 有無mail
  rankDatas: Array<any>; // 排行板資料
  meta: any; // api回的meta資料
  isFirstPage: boolean; // 是否為第一頁
  isLastPage: boolean; // 是否為最後一頁
  isHaveDatas: boolean; // 當前條件下的rankDatas有無資料
  distance: number; // 該地圖的距離資料
  response: any; // rankDatas 回的res載體
  isClearIconShow = false;
  active = false; // select options的開關
  emailOptions: any; // select async options
  isSelectLoading = false;
  tempEmail: string;

  constructor(
    private router: Router,
    private globalEventsManager: GlobalEventsManager,
    private rankFormService: RankFormService
  ) {
    this.handleSearchEmail = debounce(this.handleSearchEmail, 1000);
  }

  ngOnInit() {
    this.globalEventsManager.showNavBarEmitter.subscribe((mode) => {
      this.isMaskShow = mode;
    });
    this.globalEventsManager.showCollapseEmitter.subscribe((mode) => {
      this.isCollapseOpen = mode;
    });
    this.globalEventsManager.getMapOptionsEmitter.subscribe((options) => {
      const { mapDatas, monthDatas } = options;

      if (monthDatas) {
        this.mapDatas = mapDatas;
        this.monthDatas = monthDatas;
        this.month = monthDatas[0].month;
      }
    });
    this.globalEventsManager.getMapIdEmitter.subscribe((id) => {
      this.mapId = id;
    });
  }
  selectMap(id) {
    this.mapId = id;
    this.globalEventsManager.getMapId(this.mapId);
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
      params = params.append('email', encodeURIComponent(email.trim()));
    }
    this.email = email && email.trim();
    this.fetchRankForm(params);
  }
  fetchRankForm(params) {
    this.globalEventsManager.showLoading(true);
    this.rankFormService.getRank(params).subscribe(res => {
      this.response = res;
      this.globalEventsManager.showLoading(false);
      const { datas, meta } = this.response;
      this.rankDatas = datas;
      const data = {
        datas,
        meta,
        email: this.email
      };
      this.globalEventsManager.getRankForm(data);
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
      month: this.month,
      mapId: this.mapId,
      groupId: this.groupId
    };
    this.router.navigateByUrl(
      `${location.pathname}?${buildUrlQueryStrings(paramDatas)}`
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
  openActive(event: any) {
    event.stopPropagation();
    this.active = !this.active;
  }
  @HostListener('document:click')
  close() {
    this.active = false;
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
  remove(index: number, event?: any): void {
    if (this.email && this.emailOptions.length > 1) {
      this.emailOptions.push(this.tempEmail);
    }
    this.email = this.emailOptions[index];
    if (this.emailOptions.length > 1) {
      this.tempEmail = this.emailOptions.splice(index, 1).toString();
    }
  }
  clear() {
    this.email = '';
    this.isClearIconShow = false;
  }
}
