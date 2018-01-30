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

  email: string;
  phone: string;
  isFoundUser = false; // 標記目標email
  mapName: string; // 該地圖名字
  isHaveEmail: boolean; // 有無mail
  isHavePhone: boolean; // 有無phone  
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
  phoneOptions: any; // select async options  
  isSelectLoading = false;
  tempEmail: string;
  tempPhone: string;  
  isEventTab: boolean;
  tabIdx = 2;
  isEmailSearch = true;

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
      const { mapDatas, monthDatas } = options;
      if (mapDatas) {
        this.mapDatas = mapDatas;
      }
      if (monthDatas) {
        this.monthDatas = monthDatas;
        this.month = monthDatas[0].month;
      }
    });
    this.globalEventsManager.getMapIdEmitter.subscribe(id => {
      this.mapId = id;
    });
    this.globalEventsManager.getTabIdxEmitter.subscribe(idx => {
      this.tabIdx = idx;
    });
  }
  selectMap(id) {
    this.mapId = id;
  }
  onSubmit(form, event: any) {
    event.stopPropagation();
    const {
      email,
      phone,
      mapId,
      groupId,
      selectedStartDate,
      selectedEndDate
    } = form.value;
    this.email = email;
    this.phone = phone;
    this.isFoundUser = this.email || this.phone ? true : false;
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
    this.isHaveEmail = email ? true : false;
    this.isHavePhone = phone ? true : false;    
    if (this.groupId !== '2') {
      params = params.append('gender', this.groupId);
    }
    if (email) {
      params = params.append('email', encodeURIComponent(email.trim()));
    }
    if (phone) {
      params = params.append('phone', phone.trim());
    }
    if (this.tabIdx === 1) {
      params = params.set('startDate', '2018-01-10');
      params = params.set('endDate', '2018-02-09');
      params = params.set('event_id', '201811014');
    }
    this.email = email && email.trim();
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
        email: this.email,
        phone: this.phone,
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
        email: this.email,
        phone: this.phone,
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
    if (this.tabIdx === 1) {
      paramDatas = {
        pageNumber: this.meta.currentPage,
        mapId: this.mapId,
        groupId: this.groupId,
        event: '201811014'
      };
    } else if (this.tabIdx === 2) {
      paramDatas = {
        pageNumber: this.meta.currentPage,
        mapId: this.mapId,
        groupId: this.groupId,
        event: '20181277'
      };
    } else if (this.tabIdx === 3) {
      paramDatas = {
        pageNumber: this.meta.currentPage,
        mapId: this.mapId,
        groupId: this.groupId,
        event: '20181287'
      };
    } else if (this.tabIdx === 4) {
      paramDatas = {
        pageNumber: this.meta.currentPage,
        mapId: this.mapId,
        groupId: this.groupId,
        event: '20181297'
      };
    } else if (this.tabIdx === 5) {
      paramDatas = {
        pageNumber: this.meta.currentPage,
        mapId: this.mapId,
        groupId: this.groupId,
        event: '20181307'
      };
    } else {
      paramDatas = {
        pageNumber: this.meta.currentPage,
        startDate: this.startDate,
        endDate: this.endDate,
        mapId: this.mapId,
        groupId: this.groupId
      };
    }

    this.router.navigateByUrl(
      `${location.pathname}?${buildUrlQueryStrings(paramDatas)}`
    );
  }
  public inputEvent(e: any, isUpMode: boolean = false): void {
    if (e.target.value.length > 0 && (this.email || this.phone)) {
      this.isClearIconShow = true;
    } else {
      this.isClearIconShow = false;
    }
    this.handleSearchEmail();
  }
  public focusEvent(e: any, isUpMode: boolean = false): void {
    if (e.target.value.length > 0 && (this.email || this.phone)) {
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
    if (this.tabIdx === 1) {
      params = params.set('startDate', '2018-01-10');
      params = params.set('endDate', '2018-02-09');
      params = params.set('event_id', '201811014');
    } else if (this.tabIdx === 2) {
      params = params.set('start_date_time', '1517007600');
      params = params.set('end_date_time', '1517093999');
      params = params.set('event_id', '20181277');
      params = params.set('isRealTime', 'true');
    } else if (this.tabIdx === 3) {
      params = params.set('start_date_time', '1517094000');
      params = params.set('end_date_time', '1517180399');
      params = params.set('event_id', '20181287');
      params = params.set('isRealTime', 'true');
    } else if (this.tabIdx === 4) {
      params = params.set('start_date_time', '1517180400');
      params = params.set('end_date_time', '1517266799');
      params = params.set('event_id', '20181297');
      params = params.set('isRealTime', 'true');
    } else if (this.tabIdx === 5) {
      params = params.set('start_date_time', '1517266800');
      params = params.set('end_date_time', '1517353199');
      params = params.set('event_id', '20181307');
      params = params.set('isRealTime', 'true');
    } else {
      params = params.set('startDate', this.startDate);
      params = params.set('endDate', this.endDate);
    }

    if (this.groupId !== '2') {
      params = params.set('gender', this.groupId);
    }
    if (this.isEmailSearch) {
      params = params.set('keyword', this.email);
      this.rankFormService.getEmail(params).subscribe(res => {
        this.emailOptions = res;
        this.isSelectLoading = false;
      });
    } else {
      params = params.set('keyword', this.phone);
      this.rankFormService.getPhone(params).subscribe(res => {
        this.phoneOptions = res;
        this.isSelectLoading = false;
      });
    }
  }
  remove(index: number, event?: any): void {
    if (this.isEmailSearch) {
      if (this.email && this.emailOptions.length > 1) {
        this.emailOptions.push(this.tempEmail);
      }
      this.email = this.emailOptions[index];
      if (this.emailOptions.length > 1) {
        this.tempEmail = this.emailOptions.splice(index, 1).toString();
      }
    } else {
      if (this.phone && this.phoneOptions.length > 1) {
        this.phoneOptions.push(this.tempPhone);
      }
      this.phone = this.phoneOptions[index].searchPhone;
      if (this.phoneOptions.length > 1) {
        this.tempPhone = this.phoneOptions.splice(index, 1).toString();
      }
    }
  }
  clear() {
    this.email = '';
    this.phone = '';
    this.isClearIconShow = false;
  }
  touchMask() {
    this.isCollapseOpen = false;
    this.globalEventsManager.openCollapse(this.isCollapseOpen);
    this.isMaskShow = false;
    this.globalEventsManager.closeCollapse(false);
  }
  switchSearchItem(target) {
    if (
      (target === 'email' && !this.isEmailSearch) ||
      (target === 'phone' && this.isEmailSearch)
    ) {
      this.isEmailSearch = !this.isEmailSearch;
    }
  }
}
