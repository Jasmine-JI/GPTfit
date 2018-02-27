import { Component, OnInit, HostListener } from '@angular/core';
import { GlobalEventsManager } from '@shared/global-events-manager';
// import debounce from 'debounce';
import { HttpParams } from '@angular/common/http';

import { RankFormService } from './services/rank-form.service';
import {
  buildUrlQueryStrings,
  buildPageMeta,
  debounce,
  getUrlQueryStrings
} from '@shared/utils/';
import { Router } from '@angular/router';
import { IMyDpOptions } from 'mydatepicker';
import * as moment from 'moment';

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
  groupId = '2';
  month = (new Date().getMonth() + 1).toString();
  startDateOptions: IMyDpOptions = {
    height: '30px',
    selectorWidth: ((window.screen.width - 60) / 2).toString(),
    dateFormat: 'yyyy-mm-dd',
    disableUntil: { year: 2017, month: 12, day: 4 },
    disableSince: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getUTCDate() + 1
    }
  };
  endDateOptions: IMyDpOptions = {
    height: '30px',
    selectorWidth: ((window.screen.width - 60) / 2).toString(),
    dateFormat: 'yyyy-mm-dd',
    disableUntil: { year: 2017, month: 12, day: 4 },
    disableSince: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getUTCDate() + 1
    }
  };
  startDay: any = {
    date: {
      year: 2017,
      month: 12,
      day: 5
    }
  };
  finalDay: any = {
    date: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getUTCDate()
    }
  };
  startDate: string;
  endDate: string;
  date: any;

  userName: string;
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
  isEventTab: boolean;
  tabIdx = 2;
  isEmailSearch = true;
  rankTabs: any;

  constructor(
    private router: Router,
    private globalEventsManager: GlobalEventsManager,
    private rankFormService: RankFormService
  ) {
    this.handleSearchEmail = debounce(this.handleSearchEmail, 1000);
  }

  ngOnInit() {
    // this.startDateOptions.selectorWidth = ((window.screen.width - 60) / 2).toString();
    this.startDate = this.convertDateString(this.startDay);
    this.endDate = this.convertDateString(this.finalDay);
    this.globalEventsManager.showNavBarEmitter.subscribe(mode => {
      this.isMaskShow = mode;
    });
    this.globalEventsManager.showCollapseEmitter.subscribe(mode => {
      this.isCollapseOpen = mode;
      if (this.isCollapseOpen) {
        const { event } = getUrlQueryStrings(location.search);
        if (event && event.length > 0) {
          this.isEventTab = true;
          if (event === '201811014') {
            this.tabIdx = 1;
          } else if (event === '20181277') {
            this.tabIdx = 2;
          } else if (event === '20181287') {
            this.tabIdx = 3;
          } else if (event === '20181297') {
            this.tabIdx = 4;
          } else if (event === '20181307') {
            this.tabIdx = 5;
          } else {
            this.tabIdx = 0;
          }
        } else {
          this.isEventTab = false;
        }
      }
    });
    this.globalEventsManager.getMapOptionsEmitter.subscribe(options => {
      const { mapDatas } = options;
      if (mapDatas) {
        this.mapDatas = mapDatas;
      }
    });
    this.globalEventsManager.getMapIdEmitter.subscribe(id => {
      this.mapId = id;
    });
    this.globalEventsManager.getTabIdxEmitter.subscribe(idx => {
      this.tabIdx = idx;
    });
    this.globalEventsManager.getRankTabsEmitter.subscribe(datas => {
      this.rankTabs = datas;
    });
  }
  selectMap(id) {
    this.mapId = id;
  }
  onSubmit(form, event: any) {
    event.stopPropagation();
    const {
      userName,
      mapId,
      groupId,
      selectedStartDate,
      selectedEndDate
    } = form.value;
    this.userName = userName;
    this.isFoundUser = this.userName ? true : false;
    this.mapId = mapId;
    this.groupId = groupId;
    let params = new HttpParams();
    this.startDay = this.convertDateFormat(selectedStartDate);
    this.finalDay = this.convertDateFormat(selectedEndDate);
    this.startDate = this.convertDateString(selectedStartDate);
    this.endDate = this.convertDateString(selectedEndDate);
    params = params.append('mapId', this.mapId.toString());
    params = params.set('startDate', this.startDate);
    params = params.set('endDate', this.endDate);
    this.isHaveEmail = userName ? true : false;
    if (this.groupId !== '2') {
      params = params.append('gender', this.groupId);
    }
    if (userName) {
      params = params.append('userName', userName.trim());
    }
    if (this.tabIdx === 1) {
      params = params.set('startDate', '2018-01-10');
      params = params.set('endDate', '2018-02-09');
      params = params.set('event_id', '201811014');
    }
    this.userName = userName && userName.trim();
    if (this.tabIdx === 0 || this.tabIdx === 1) {
      this.fetchRankForm(params);
    } else if (this.tabIdx === 2) {
      params = params.set('start_date_time', '1517007600');
      params = params.set('end_date_time', '1517093999');
      params = params.set('event_id', '20181277');
      this.fetchRealTimeRank(params);
    } else if (this.tabIdx === 3) {
      params = params.set('start_date_time', '1517094000');
      params = params.set('end_date_time', '1517180399');
      params = params.set('event_id', '20181287');
      this.fetchRealTimeRank(params);
    } else if (this.tabIdx === 4) {
      params = params.set('start_date_time', '1517180400');
      params = params.set('end_date_time', '1517266799');
      params = params.set('event_id', '20181297');
      this.fetchRealTimeRank(params);
    } else if (this.tabIdx === 5) {
      params = params.set('start_date_time', '1517266800');
      params = params.set('end_date_time', '1517353199');
      params = params.set('event_id', '20181307');
      this.fetchRealTimeRank(params);
    }
  }
  convertDateString(_date) {
    if (_date) {
      const { date: { day, month, year } } = _date;
      return year.toString() + '-' + month.toString() + '-' + day.toString();
    }
    return (
      new Date().getFullYear() +
      '-' +
      new Date().getMonth() +
      1 +
      '-' +
      new Date().getUTCDate()
    );
  }
  convertDateFormat(_date) {
    if (_date) {
      const { date: { day, month, year } } = _date;
      const data = {
        date: {
          year,
          month,
          day
        }
      };
      return data;
    }
    return {
      date: {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getUTCDate()
      }
    };
  }
  fetchRankForm(params) {
    this.globalEventsManager.showLoading(true);
    this.rankFormService.getRank(params).subscribe(res => {
      this.response = res;
      this.globalEventsManager.showLoading(false);
      this.globalEventsManager.getMapId(this.mapId);
      this.isCollapseOpen = false;
      this.isMaskShow = false;
      const { datas, meta } = this.response;
      this.rankDatas = datas;
      const data = {
        datas,
        meta,
        startDate: this.startDate,
        endDate: this.endDate,
        startDay: this.startDay,
        finalDay: this.finalDay,
        userName: this.userName,
        mapId: this.mapId,
        groupId: this.groupId
      };
      this.globalEventsManager.getRankForm(data);
      this.distance =
        this.rankDatas.length > 0 && this.rankDatas[0].race_total_distance;
      this.meta = buildPageMeta(meta);
      const { currentPage, maxPage } = this.meta;
      this.isFirstPage = currentPage === 1;
      this.isLastPage = currentPage === maxPage;
      this.isHaveDatas = this.rankDatas.length > 0;
      this.toHistoryPrePage();
    });
  }

  fetchRealTimeRank(params) {
    this.globalEventsManager.showLoading(true);
    this.rankFormService.getRealTimeEvent(params).subscribe(res => {
      this.globalEventsManager.showLoading(false);
      this.globalEventsManager.getMapId(this.mapId);
      this.isCollapseOpen = false;
      this.isMaskShow = false;
      this.response = res;
      const { datas, meta } = this.response;
      this.rankDatas = datas;
      const data = {
        datas,
        meta,
        startDate: this.startDate,
        endDate: this.endDate,
        startDay: this.startDay,
        finalDay: this.finalDay,
        userName: this.userName,
        mapId: this.mapId,
        groupId: this.groupId
      };
      this.rankDatas.forEach((data, idx) => {
        if (idx > 0) {
          if (this.rankDatas[idx - 1].offical_time === data.offical_time) {
            data.rank = this.rankDatas[idx - 1].rank;
          } else {
            data.rank = this.rankDatas[idx - 1].rank + 1;
          }
        } else {
          data.rank = 1;
        }
      });
      this.meta = buildPageMeta(meta);
      this.globalEventsManager.getRankForm(data);
      const { currentPage, maxPage } = this.meta;
      this.isFirstPage = currentPage === 1;
      this.isLastPage = currentPage === maxPage;
      this.isHaveDatas = this.rankDatas.length > 0;
      this.toHistoryPrePage();
    });
  }
  toHistoryPrePage() {
    let paramDatas = {};
    if (this.tabIdx === 0) {
      paramDatas = {
        pageNumber: this.meta.currentPage,
        startDate: this.startDate,
        endDate: this.endDate,
        mapId: this.mapId,
        groupId: this.groupId
      };
    } else {
      const eventId = this.rankTabs[this.tabIdx - 1].event_id;
      paramDatas = {
        pageNumber: this.meta.currentPage,
        mapId: this.mapId,
        groupId: this.groupId,
        eventId
      };
    }

    this.router.navigateByUrl(
      `${location.pathname}?${buildUrlQueryStrings(paramDatas)}`
    );
  }
  public inputEvent(e: any, isUpMode: boolean = false): void {
    if (e.target.value.length > 0 && this.userName) {
      this.isClearIconShow = true;
    } else {
      this.isClearIconShow = false;
    }
    this.handleSearchEmail();
  }
  public focusEvent(e: any, isUpMode: boolean = false): void {
    if (e.target.value.length > 0 && this.userName) {
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
    params = params.set('mapId', this.mapId.toString());
    if (this.tabIdx > 0) {
      const {
        time_stamp_start,
        time_stamp_end,
        is_real_time,
        event_id
      } = this.rankTabs[this.tabIdx - 1];
      if (is_real_time === 1) {
        params = params.set('start_date_time', time_stamp_start);
        params = params.set('end_date_time', time_stamp_end);
        params = params.set('event_id', event_id);
        params = params.set('isRealTime', 'true');
      } else {
        params = params.set('startDate', moment(time_stamp_start).format('YYYY-MM-DD'));
        params = params.set('endDate', moment(time_stamp_end).format('YYYY-MM-DD'));
      }
    } else {
      params = params.set('startDate', this.startDate);
      params = params.set('endDate', this.endDate);
    }


    if (this.groupId !== '2') {
      params = params.set('gender', this.groupId);
    }
    params = params.set('keyword', this.userName);
    this.rankFormService.getName(params).subscribe(res => {
      this.emailOptions = res;
      this.isSelectLoading = false;
    });
  }
  remove(index: number, event?: any): void {
    if (this.isEmailSearch) {
      if (this.userName && this.emailOptions.length > 1) {
        this.emailOptions.push(this.tempEmail);
      }
      this.userName = this.emailOptions[index];
      if (this.emailOptions.length > 1) {
        this.tempEmail = this.emailOptions.splice(index, 1).toString();
      }
    }
  }
  clear() {
    this.userName = '';
    this.isClearIconShow = false;
  }
  touchMask() {
    this.isCollapseOpen = false;
    this.globalEventsManager.openCollapse(this.isCollapseOpen);
    this.isMaskShow = false;
    this.globalEventsManager.closeCollapse(false);
  }
}
