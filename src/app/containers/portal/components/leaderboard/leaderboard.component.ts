import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
// import debounce from 'debounce';
import { RankFormService } from '../../services/rank-form.service';
import { mapImages } from '@shared/mapImages';
import {
  isObjectEmpty,
  buildUrlQueryStrings,
  getUrlQueryStrings,
  buildPageMeta,
  debounce
} from '@shared/utils/';
import { GlobalEventsManager } from '@shared/global-events-manager';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { IMyDpOptions } from 'mydatepicker';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css']
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  rankDatas: Array<any>; // 排行板資料
  monthDatas: any; // 有資料的月份
  mapDatas: any; // 有資料的地圖
  mapId = 1; // 預設為第一張地圖
  idx: number;
  month = (new Date().getMonth() + 1).toString();
  meta: any; // api回的meta資料
  isFirstPage: boolean; // 是否為第一頁
  isLastPage: boolean; // 是否為最後一頁
  isHaveDatas: boolean; // 當前條件下的rankDatas有無資料
  groupId = '2'; // 組別 預設為無分組
  isHaveEmail: boolean; // 有無mail
  isHavePhone: boolean; // 有無phone
  email: string;
  phone: string;
  active = false; // select options的開關
  isSelectLoading = false; // select async loading開關
  tempEmail: string; // 存select上一筆被選的email
  tempPhone: string;
  emailOptions: any; // select async options
  phoneOptions: any;
  isFoundUser = false; // 標記目標email
  bgImageUrl: string; // 背景圖
  distance: number; // 該地圖的距離資料
  tabIdx = 2; // 目前代表為ISPO
  mapName: string; // 該地圖名字
  isLoading = false;
  currentPage: number;
  isClearIconShow = false;
  finalEventDate: string;
  timer: any;
  startDateOptions: IMyDpOptions = {
    height: '30px',
    width: '200px',
    selectorWidth: '200px',
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
    width: '200px',
    selectorWidth: '200px',
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
  ispoArray = [
    '2018/01/27 23:59:59',
    '2018/01/28 23:59:59',
    '2018/01/29 23:59:59',
    '2018/01/30 23:59:59'
  ];
  isEmailSearch = true;
  rankTabs: any;

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
    this.startDate = this.convertDateString(this.startDay);
    this.endDate = this.convertDateString(this.finalDay);
    this.rankFormService.getRankTabs().subscribe((res) => {
      this.rankTabs = res;
    });
    if (!isObjectEmpty(queryStrings)) {
      const {
        pageNumber,
        month,
        mapId,
        groupId,
        startDate,
        endDate,
        event
      } = queryStrings;
      if (pageNumber) {
        params = params.set('pageNumber', pageNumber);
      }
      if (startDate) {
        this.startDate = startDate;
        this.startDay = this.convertStringDatetoFormat(this.startDate);
        params = params.set('startDate', startDate);
      }
      if (endDate) {
        this.endDate = endDate;
        this.finalDay = this.convertStringDatetoFormat(this.endDate);
        params = params.set('endDate', endDate);
      }
      if (month) {
        this.month = month;
        params = params.set('month', month);
      }
      if (mapId) {
        this.mapId = Number(mapId);
        params = params.set('mapId', mapId);
      }
      if (groupId !== '2') {
        this.groupId = groupId;
        params = params.set('gender', groupId);
      }
      if (event) {
        params = params.set('event_id', event);
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
        }
      } else {
        this.tabIdx = 0;
      }
    }
    if (this.tabIdx === 1) {
      params = params.set('event_id', '201811014');
      params = params.set('startDate', '2018-01-10');
      params = params.set('endDate', '2018-02-09');
    } else if (this.tabIdx === 2) {
      params = params.set('start_date_time', '1517007600');
      params = params.set('end_date_time', '1517093999');
      params = params.set('event_id', '20181277');
    } else if (this.tabIdx === 3) {
      params = params.set('start_date_time', '1517094000');
      params = params.set('end_date_time', '1517180399');
      params = params.set('event_id', '20181287');
    } else if (this.tabIdx === 4) {
      params = params.set('start_date_time', '1517180400');
      params = params.set('end_date_time', '1517266799');
      params = params.set('event_id', '20181297');
    } else if (this.tabIdx === 5) {
      params = params.set('start_date_time', '1517266800');
      params = params.set('end_date_time', '1517353199');
      params = params.set('event_id', '20181307');
    }
    params = params.set('mapId', this.mapId.toString());
    this.bgImageUrl = `url(${mapImages[this.mapId - 1]})`; // 背景圖 ，預設為取雅典娜
    const fetchMapOptions = this.rankFormService.getMapOptions();

    forkJoin([fetchMapOptions]).subscribe(results => {
      this.mapDatas = results[0];
      this.idx = this.mapDatas.findIndex(_data => _data.map_id === this.mapId);
      if (this.idx > -1) {
        this.mapName = this.mapDatas[this.idx].map_name;
        this.distance = this.mapDatas[this.idx].distance;
        this.bgImageUrl = `url(${mapImages[this.mapId - 1]})`;
      }
      this.monthDatas = results[1];
      if (
        this.tabIdx !== 2 &&
        this.tabIdx !== 3 &&
        this.tabIdx !== 4 &&
        this.tabIdx !== 5
      ) {
        this.fetchRankForm(params);
      } else {
        this.fetchRealTimeRank(params);
        this.timer = setInterval(() => {
          if (this.tabIdx !== 0 && this.tabIdx !== 1) {
            this.fetchRealTimeRank(params);
          }
        }, 300000);
      }
      const { mapDatas, monthDatas } = this;
      const searchOptions = {
        mapDatas,
        monthDatas
      };
      this.globalEventsManager.getMapOptions(searchOptions);
      this.globalEventsManager.getMapId(this.mapId);
    });
    this.globalEventsManager.getRankFormEmitter.subscribe(res => {
      if (res) {
        const {
          datas,
          email,
          phone,
          meta,
          mapId,
          startDate,
          endDate,
          startDay,
          finalDay,
          groupId
        } = res;
        this.rankDatas = datas;
        this.email = email;
        this.phone = phone;
        this.mapId = mapId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.startDay = startDay;
        this.finalDay = finalDay;
        this.groupId = groupId;
        if (this.idx > -1) {
          this.mapName = this.mapDatas[this.idx].map_name;
          this.distance = this.mapDatas[this.idx].distance;
          this.bgImageUrl = `url(${mapImages[this.mapId - 1]})`;
        }
        if (meta) {
          this.isHaveEmail = false;
          this.isHavePhone = false;
          this.meta = buildPageMeta(meta);
        } else {
          this.isHavePhone = phone ? true : false;
          this.isHaveEmail = email ? true : false;
          this.isFoundUser = true;
        }
        if (this.rankDatas && this.rankDatas.length > 0) {
          this.isHaveDatas = true;
          this.mapId = datas[0].map_id;
          this.mapName = datas[0].map_name;
        } else {
          this.isHaveDatas = false;
        }
      }
    });
    this.globalEventsManager.showLoadingEmitter.subscribe(isLoading => {
      this.isLoading = isLoading;
    });
    this.globalEventsManager.getMapIdEmitter.subscribe(id => {
      if (id && this.mapDatas) {
        this.mapId = id;
        this.idx = this.mapDatas.findIndex(
          _data => _data.map_id === Number(this.mapId)
        );
        this.mapName = this.mapDatas[this.idx].map_name;
      }
    });
  }
  ngOnDestroy() {
    clearInterval(this.timer);
  }
  onSubmit(form, event: any) {
    clearInterval(this.timer);
    event.stopPropagation();
    const {
      email,
      phone,
      mapId,
      groupId,
      selectedStartDate,
      selectedEndDate
    } = form.value;
    this.mapId = mapId;
    this.idx = this.mapDatas.findIndex(
      _data => _data.map_id === Number(this.mapId)
    );
    if (this.idx > -1) {
      this.mapName = this.mapDatas[this.idx].map_name;
      this.distance = this.mapDatas[this.idx].distance;
      this.bgImageUrl = `url(${mapImages[this.mapId - 1]})`;
    }
    this.email = email;
    this.phone = phone;
    this.isFoundUser = this.email || this.phone ? true : false;
    this.groupId = groupId;
    this.startDay = this.convertDateFormat(selectedStartDate);
    this.finalDay = this.convertDateFormat(selectedEndDate);
    this.startDate = this.convertDateString(selectedStartDate);
    this.endDate = this.convertDateString(selectedEndDate);
    let params = new HttpParams();
    params = params.set('mapId', this.mapId.toString());
    if (this.tabIdx === 1) {
      params = params.set('startDate', '2018-01-10');
      params = params.set('endDate', '2018-02-09');
      params = params.set('event_id', '201811014');
    } else if (this.tabIdx === 0) {
      params = params.set('startDate', this.startDate);
      params = params.set('endDate', this.endDate);
    }

    this.isHaveEmail = email ? true : false;
    this.isHavePhone = phone ? true : false;
    if (this.groupId !== '2') {
      params = params.set('gender', this.groupId);
    }
    if (email) {
      params = params.set('email', encodeURIComponent(email.trim()));
    }
    if (phone) {
      params = params.set('phone', phone.trim());
    }
    this.email = email && email.trim();
    if (
      this.tabIdx !== 2 &&
      this.tabIdx !== 3 &&
      this.tabIdx !== 4 &&
      this.tabIdx !== 5
    ) {
      this.fetchRankForm(params);
    } else {
      if (this.tabIdx === 2) {
        params = params.set('start_date_time', '1517007600');
        params = params.set('end_date_time', '1517093999');
        params = params.set('event_id', '20181277');
      } else if (this.tabIdx === 3) {
        params = params.set('start_date_time', '1517094000');
        params = params.set('end_date_time', '1517180399');
        params = params.set('event_id', '20181287');
      } else if (this.tabIdx === 4) {
        params = params.set('start_date_time', '1517180400');
        params = params.set('end_date_time', '1517266799');
        params = params.set('event_id', '20181297');
      } else if (this.tabIdx === 5) {
        params = params.set('start_date_time', '1517266800');
        params = params.set('end_date_time', '1517353199');
        params = params.set('event_id', '20181307');
      }
      params = params.set('mapId', this.mapId.toString());
      this.fetchRealTimeRank(params);
      this.timer = setInterval(() => {
        if (this.tabIdx !== 0 && this.tabIdx !== 1) {
          this.fetchRealTimeRank(params);
        }
      }, 300000);
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
  convertStringDatetoFormat(_date) {
    const dateArray = _date.split('-');
    return {
      date: {
        year: Number(dateArray[0]),
        month: Number(dateArray[1]),
        day: Number(dateArray[2])
      }
    };
  }
  onPageChange(pageNumber) {
    clearInterval(this.timer);
    this.currentPage = pageNumber;
    let params = new HttpParams();
    if (this.groupId !== '2') {
      params = params.set('gender', this.groupId);
    }
    if (this.email) {
      params = params.set('email', encodeURIComponent(this.email.trim()));
    }
    params = params.set('mapId', this.mapId.toString());
    params = params.set('pageNumber', this.currentPage.toString());
    if (
      this.tabIdx !== 2 &&
      this.tabIdx !== 3 &&
      this.tabIdx !== 4 &&
      this.tabIdx !== 5
    ) {
      if (this.tabIdx === 1) {
        params = params.set('startDate', '2018-01-10');
        params = params.set('endDate', '2018-02-09');
        params = params.set('event_id', '201811014');
        this.finalEventDate = '2018-02-09';
      } else {
        params = params.set('startDate', this.startDate);
        params = params.set('endDate', this.endDate);
        this.finalEventDate = '';
      }
      if (this.groupId !== '2') {
        params = params.set('gender', this.groupId);
      }
      this.fetchRankForm(params);
    } else {
      if (this.tabIdx === 2) {
        params = params.set('start_date_time', '1517007600');
        params = params.set('end_date_time', '1517093999');
        params = params.set('event_id', '20181277');
      } else if (this.tabIdx === 3) {
        params = params.set('start_date_time', '1517094000');
        params = params.set('end_date_time', '1517180399');
        params = params.set('event_id', '20181287');
      } else if (this.tabIdx === 4) {
        params = params.set('start_date_time', '1517180400');
        params = params.set('end_date_time', '1517266799');
        params = params.set('event_id', '20181297');
      } else if (this.tabIdx === 5) {
        params = params.set('start_date_time', '1517266800');
        params = params.set('end_date_time', '1517353199');
        params = params.set('event_id', '20181307');
      }
      params = params.set('mapId', this.mapId.toString());
      this.fetchRealTimeRank(params);
      this.timer = setInterval(() => {
        if (this.tabIdx !== 0 && this.tabIdx !== 1) {
          this.fetchRealTimeRank(params);
        }
      }, 300000);
    }
  }
  fetchRankForm(params) {
    this.isLoading = true;
    this.rankFormService.getRank(params).subscribe(res => {
      this.isLoading = false;
      const { datas, meta } = res;
      this.rankDatas = datas;
      this.meta = buildPageMeta(meta);
      const { currentPage, maxPage } = this.meta;
      this.isFirstPage = currentPage === 1;
      this.isLastPage = currentPage === maxPage;
      this.isHaveDatas = this.rankDatas.length > 0;
      this.toHistoryPrePage(this.tabIdx);
    });
  }
  fetchRealTimeRank(params) {
    this.isLoading = true;
    this.rankFormService.getRealTimeEvent(params).subscribe(res => {
      this.isLoading = false;
      const { datas, meta } = res;
      this.rankDatas = datas;
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
      const { currentPage, maxPage } = this.meta;
      this.isFirstPage = currentPage === 1;
      this.isLastPage = currentPage === maxPage;
      this.isHaveDatas = this.rankDatas.length > 0;
      this.toHistoryPrePage(this.tabIdx);
    });
  }
  toHistoryPrePage(tabIdx) {
    let paramDatas = {};
    if (tabIdx === 1) {
      paramDatas = {
        pageNumber: this.meta.currentPage,
        mapId: this.mapId,
        groupId: this.groupId,
        event: '201811014'
      };
    } else if (tabIdx === 2) {
      paramDatas = {
        pageNumber: this.meta.currentPage,
        mapId: this.mapId,
        groupId: this.groupId,
        event: '20181277'
      };
    } else if (tabIdx === 3) {
      paramDatas = {
        pageNumber: this.meta.currentPage,
        mapId: this.mapId,
        groupId: this.groupId,
        event: '20181287'
      };
    } else if (tabIdx === 4) {
      paramDatas = {
        pageNumber: this.meta.currentPage,
        mapId: this.mapId,
        groupId: this.groupId,
        event: '20181297'
      };
    } else if (tabIdx === 5) {
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
  toMapInfoPage(userId) {
    let paramDatas = {
      date: this.date,
      mapId: this.mapId,
      userId,
      event: '0',
      start_time: 0,
      end_time: 0
    };
    if (this.tabIdx !== 0 && this.tabIdx !== 1) {
      paramDatas = {
        date: this.date,
        mapId: this.mapId,
        userId,
        event: '1',
        start_time: 0,
        end_time: 0
      };
      if (this.tabIdx === 2) {
        paramDatas.start_time = 1517007600;
        paramDatas.end_time = 1517093999;
      } else if (this.tabIdx === 3) {
        paramDatas.start_time = 1517094000;
        paramDatas.end_time = 1517180399;
      } else if (this.tabIdx === 4) {
        paramDatas.start_time = 1517180400;
        paramDatas.end_time = 1517266799;
      } else if (this.tabIdx === 5) {
        paramDatas.start_time = 1517266800;
        paramDatas.end_time = 1517353199;
      }
    }

    this.router.navigateByUrl(
      `${location.pathname}/mapInfo?${buildUrlQueryStrings(paramDatas)}`
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
  openActive(event: any) {
    event.stopPropagation();
    this.active = !this.active;
  }
  closeActive(event: any) {
    event.stopPropagation();
    this.active = false;
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
  preMap() {
    clearInterval(this.timer);
    this.idx = this.mapDatas.findIndex(
      _data => _data.map_id === Number(this.mapId)
    );
    if (this.idx - 1 === -1) {
      this.idx = this.mapDatas.length - 1;
    } else {
      this.idx--;
    }
    this.mapId = this.mapDatas[this.idx].map_id;
    this.distance = this.mapDatas[this.idx].distance;

    this.mapName = this.mapDatas[this.idx].map_name;
    this.bgImageUrl = `url(${mapImages[this.mapId - 1]})`;

    let params = new HttpParams();
    params = params.set('mapId', this.mapId.toString());
    if (this.groupId !== '2') {
      params = params.set('gender', this.groupId);
    }
    if (this.email) {
      params = params.set('email', encodeURIComponent(this.email.trim()));
    }
    if (
      this.tabIdx !== 2 &&
      this.tabIdx !== 3 &&
      this.tabIdx !== 4 &&
      this.tabIdx !== 5
    ) {
      if (this.tabIdx === 1) {
        params = params.set('startDate', '2018-01-10');
        params = params.set('endDate', '2018-02-09');
        params = params.set('event_id', '201811014');
        this.finalEventDate = '2018-02-09';
      } else {
        params = params.set('startDate', this.startDate);
        params = params.set('endDate', this.endDate);
        this.finalEventDate = '';
      }
      if (this.groupId !== '2') {
        params = params.set('gender', this.groupId);
      }
      this.fetchRankForm(params);
    } else {
      if (this.tabIdx === 2) {
        params = params.set('start_date_time', '1517007600');
        params = params.set('end_date_time', '1517093999');
        params = params.set('event_id', '20181277');
      } else if (this.tabIdx === 3) {
        params = params.set('start_date_time', '1517094000');
        params = params.set('end_date_time', '1517180399');
        params = params.set('event_id', '20181287');
      } else if (this.tabIdx === 4) {
        params = params.set('start_date_time', '1517180400');
        params = params.set('end_date_time', '1517266799');
        params = params.set('event_id', '20181297');
      } else if (this.tabIdx === 5) {
        params = params.set('start_date_time', '1517266800');
        params = params.set('end_date_time', '1517353199');
        params = params.set('event_id', '20181307');
      }
      params = params.set('mapId', this.mapId.toString());
      this.fetchRealTimeRank(params);
      this.timer = setInterval(() => {
        if (this.tabIdx !== 0 && this.tabIdx !== 1) {
          this.fetchRealTimeRank(params);
        }
      }, 300000);
    }
  }
  nextMap() {
    clearInterval(this.timer);
    this.idx = this.mapDatas.findIndex(
      _data => _data.map_id === Number(this.mapId)
    );
    if (this.idx + 1 > this.mapDatas.length - 1) {
      this.idx = 0;
    } else {
      this.idx++;
    }
    this.mapId = this.mapDatas[this.idx].map_id;
    this.distance = this.mapDatas[this.idx].distance;
    this.mapName = this.mapDatas[this.idx].map_name;
    this.bgImageUrl = `url(${mapImages[this.mapId - 1]})`;
    let params = new HttpParams();
    params = params.set('mapId', this.mapId.toString());
    if (this.groupId !== '2') {
      params = params.set('gender', this.groupId);
    }
    if (this.email) {
      params = params.set('email', encodeURIComponent(this.email.trim()));
    }
    if (
      this.tabIdx !== 2 &&
      this.tabIdx !== 3 &&
      this.tabIdx !== 4 &&
      this.tabIdx !== 5
    ) {
      if (this.tabIdx === 1) {
        params = params.set('startDate', '2018-01-10');
        params = params.set('endDate', '2018-02-09');
        params = params.set('event_id', '201811014');
        this.finalEventDate = '2018-02-09';
      } else {
        params = params.set('startDate', this.startDate);
        params = params.set('endDate', this.endDate);
        this.finalEventDate = '';
      }
      if (this.groupId !== '2') {
        params = params.set('gender', this.groupId);
      }
      this.fetchRankForm(params);
    } else {
      if (this.tabIdx === 2) {
        params = params.set('start_date_time', '1517007600');
        params = params.set('end_date_time', '1517093999');
        params = params.set('event_id', '20181277');
      } else if (this.tabIdx === 3) {
        params = params.set('start_date_time', '1517094000');
        params = params.set('end_date_time', '1517180399');
        params = params.set('event_id', '20181287');
      } else if (this.tabIdx === 4) {
        params = params.set('start_date_time', '1517180400');
        params = params.set('end_date_time', '1517266799');
        params = params.set('event_id', '20181297');
      } else if (this.tabIdx === 5) {
        params = params.set('start_date_time', '1517266800');
        params = params.set('end_date_time', '1517353199');
        params = params.set('event_id', '20181307');
      }
      params = params.set('mapId', this.mapId.toString());
      this.fetchRealTimeRank(params);
      this.timer = setInterval(() => {
        if (this.tabIdx !== 0 && this.tabIdx !== 1) {
          this.fetchRealTimeRank(params);
        }
      }, 300000);
    }
  }
  selectMap(id) {
    this.globalEventsManager.getMapId(id);
  }
  clear() {
    this.email = '';
    this.phone = '';
    this.isClearIconShow = false;
  }
  selectTab(idx) {
    clearInterval(this.timer);
    this.tabIdx = idx;
    let params = new HttpParams();
    this.globalEventsManager.getTabIdx(this.tabIdx);
    params = params.set('mapId', this.mapId.toString());
    if (
      this.tabIdx !== 2 &&
      this.tabIdx !== 3 &&
      this.tabIdx !== 4 &&
      this.tabIdx !== 5
    ) {
      if (this.tabIdx === 1) {
        params = params.set('startDate', '2018-01-10');
        params = params.set('endDate', '2018-02-09');
        params = params.set('event_id', '201811014');
        this.finalEventDate = '2018-02-09';
      } else {
        params = params.set('startDate', this.startDate);
        params = params.set('endDate', this.endDate);
        this.finalEventDate = '';
      }
      if (this.groupId !== '2') {
        params = params.set('gender', this.groupId);
      }
      this.fetchRankForm(params);
    } else {
      if (this.tabIdx === 2) {
        params = params.set('start_date_time', '1517007600');
        params = params.set('end_date_time', '1517093999');
        params = params.set('event_id', '20181277');
      } else if (this.tabIdx === 3) {
        params = params.set('start_date_time', '1517094000');
        params = params.set('end_date_time', '1517180399');
        params = params.set('event_id', '20181287');
      } else if (this.tabIdx === 4) {
        params = params.set('start_date_time', '1517180400');
        params = params.set('end_date_time', '1517266799');
        params = params.set('event_id', '20181297');
      } else if (this.tabIdx === 5) {
        params = params.set('start_date_time', '1517266800');
        params = params.set('end_date_time', '1517353199');
        params = params.set('event_id', '20181307');
      }
      params = params.set('mapId', this.mapId.toString());
      this.fetchRealTimeRank(params);
      this.timer = setInterval(() => {
        if (this.tabIdx !== 0 && this.tabIdx !== 1) {
          this.fetchRealTimeRank(params);
        }
      }, 300000);
    }
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
