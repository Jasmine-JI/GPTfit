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
import * as moment from 'moment';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css']
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  rankDatas: Array<any>; // 排行板資料
  // monthDatas: any; // 有資料的月份
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
  userName: string;
  active = false; // select options的開關
  isSelectLoading = false; // select async loading開關
  tempEmail: string; // 存select上一筆被選的email
  emailOptions: any; // select async options
  isFoundUser = false; // 標記目標email
  bgImageUrl: string; // 背景圖
  distance: number; // 該地圖的距離資料
  tabIdx = 0; // 目前代表為General
  mapName: string; // 該地圖名字
  isLoading = false;
  currentPage: number;
  isClearIconShow = false;
  finalEventDate: string;
  finalEventStamp: number;
  timer: any;
  startDateOptions: IMyDpOptions = {
    height: '30px',
    width: '200px',
    selectorWidth: '200px',
    dateFormat: 'yyyy-mm-dd',
    disableUntil: { year: 2017, month: 12, day: 31 },
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
    disableUntil: { year: 2017, month: 12, day: 31 },
    disableSince: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getUTCDate() + 1
    }
  };
  startDay: any = {
    date: {
      year: 2018,
      month: 1,
      day: 1
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
  isEmailSearch = true;
  rankTabs: any;
  isRealTime: boolean;
  currentDate = moment().unix();
  customMapOptions = [];
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

    // 若有自帶字串 parse字串
    if (!isObjectEmpty(queryStrings)) {
      const {
        pageNumber,
        month,
        mapId,
        groupId,
        startDate,
        endDate
        // event
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
      if (mapId) {
        this.mapId = Number(mapId);
        params = params.set('mapId', mapId);
      }
      if (groupId !== '2') {
        this.groupId = groupId;
        params = params.set('gender', groupId);
      }
    }

    params = params.set('mapId', this.mapId.toString());
    this.bgImageUrl = `url(${mapImages[this.mapId - 1]})`; // 背景圖 ，預設為取雅典娜

    const fetchMapOptions = this.rankFormService.getMapOptions();
    const fetchRankTabs = this.rankFormService.getRankTabs();
    forkJoin([fetchMapOptions, fetchRankTabs]).subscribe(results => {
      this.mapDatas = results[0];
      this.rankTabs = results[1];
      const { sessionId } = queryStrings;
      if (sessionId) {
        const idx = this.rankTabs.findIndex(
          _tab => _tab.session_id.toString() === sessionId
        );
        this.tabIdx = idx + 1;
        this.handleRealTimeValue(this.tabIdx);
      }
      // 判斷tabIdx 並對應塞參數
      if (this.tabIdx !== 0) {
        const {
          is_real_time,
          time_stamp_start,
          time_stamp_end,
          event_id
        } = this.rankTabs[this.tabIdx - 1];
        if (is_real_time === 1) {
          params = params.set('start_date_time', time_stamp_start);
          params = params.set('end_date_time', time_stamp_end);
        } else {
          params = params.set(
            'startDate',
            moment(time_stamp_start * 1000).format('YYYY-MM-DD')
          );
          params = params.set(
            'endDate',
            moment(time_stamp_end * 1000).format('YYYY-MM-DD')
          );
        }
        params = params.set('event_id', `${event_id}`);
      } else {
        params = params.set('startDate', this.startDate);
        params = params.set('endDate', this.endDate);
      }

      this.idx = this.mapDatas.findIndex(_data => _data.map_id === this.mapId);
      if (this.idx > -1) {
        this.mapName = this.mapDatas[this.idx].map_name;
        this.distance = this.mapDatas[this.idx].distance;
        this.bgImageUrl = `url(${mapImages[this.mapId - 1]})`;
      }

      if (
        this.tabIdx === 0 ||
        this.rankTabs[this.tabIdx - 1].is_real_time === 0
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

      this.handleCoustomMaps();
      const { mapDatas, customMapOptions } = this;
      const searchOptions = { mapDatas, customMapOptions };
      this.globalEventsManager.getMapOptions(searchOptions);
      this.globalEventsManager.getMapId(this.mapId);
      this.globalEventsManager.getRankTabs(this.rankTabs);
    });
    this.globalEventsManager.getRankFormEmitter.subscribe(res => {
      if (res) {
        const {
          datas,
          userName,
          meta,
          mapId,
          startDate,
          endDate,
          startDay,
          finalDay,
          groupId
        } = res;
        this.rankDatas = datas;
        this.userName = userName;
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
          this.meta = buildPageMeta(meta);
        } else {
          this.isHaveEmail = userName ? true : false;
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
      userName,
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
    this.userName = userName;
    this.isFoundUser = this.userName ? true : false;
    this.groupId = groupId;
    this.startDay = this.convertDateFormat(selectedStartDate);
    this.finalDay = this.convertDateFormat(selectedEndDate);
    this.startDate = this.convertDateString(selectedStartDate);
    this.endDate = this.convertDateString(selectedEndDate);
    let params = new HttpParams();
    this.isHaveEmail = userName ? true : false;
    if (this.groupId !== '2') {
      params = params.set('gender', this.groupId);
    }
    if (userName) {
      params = params.set('userName', userName);
    }
    this.userName = userName && userName.trim();
    this.handleGetRankForm(params);
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

    if (this.userName) {
      params = params.set('userName', this.userName.trim());
    }
    params = params.set('pageNumber', this.currentPage.toString());
    this.handleGetRankForm(params);
  }
  handleCoustomMaps() {
    if (this.tabIdx > 0) {
      const chooseMapOptions = this.rankTabs[
        this.tabIdx - 1
      ].specific_map.split(',');
      this.customMapOptions = this.mapDatas.filter(_data => {
        if (
          chooseMapOptions.findIndex(
            _map_id => _map_id === _data.map_id.toString()
          ) > -1
        ) {
          return _data;
        }
      });
      let idx = this.customMapOptions.findIndex(_option => _option.map_id === this.mapId);
      if (idx === -1) {
        idx = 0;
      }
      this.globalEventsManager.getMapOptions({ customMapOptions: this.customMapOptions });
      this.mapId = this.customMapOptions[idx].map_id;
      this.globalEventsManager.getMapId(this.mapId);
      this.mapName = this.customMapOptions[this.tabIdx - 1].map_name;
      this.distance = this.customMapOptions[this.tabIdx - 1].distance;
      this.bgImageUrl = `url(${mapImages[this.mapId - 1]})`;
    }
  }
  handleRealTimeValue(idx) {
    if (idx > 0) {
      this.finalEventDate = moment(
        this.rankTabs[idx - 1].time_stamp_end * 1000
      ).format('YYYY-MM-DD HH:mm');
      this.finalEventStamp = this.rankTabs[idx - 1].time_stamp_end;
      if (this.rankTabs[idx - 1].is_real_time === 1) {
        this.isRealTime = true;
      } else {
        this.isRealTime = false;
      }
    } else {
      this.finalEventDate = '';
      this.finalEventStamp = 0;
      this.isRealTime = false;
    }
  }
  handleGetRankForm(params) {
    this.handleRealTimeValue(this.tabIdx);
    params = params.set('mapId', this.mapId.toString());
    if (this.tabIdx === 0) {
      params = params.set('startDate', this.startDate);
      params = params.set('endDate', this.endDate);
      this.fetchRankForm(params);
    } else if (this.isRealTime === true) {
      const { time_stamp_start, time_stamp_end, event_id } = this.rankTabs[
        this.tabIdx - 1
      ];
      params = params.set('start_date_time', time_stamp_start);
      params = params.set('end_date_time', time_stamp_end);
      params = params.set('event_id', event_id);
      this.fetchRealTimeRank(params);
      this.timer = setInterval(() => {
        if (this.tabIdx !== 0) {
          this.fetchRealTimeRank(params);
        }
      }, 300000);
    } else {
      const { time_stamp_start, time_stamp_end, event_id } = this.rankTabs[
        this.tabIdx - 1
      ];
      const startDate = moment(time_stamp_start * 1000).format('YYYY-MM-DD');
      const endDate = moment(time_stamp_end * 1000).format('YYYY-MM-DD');
      params = params.set('startDate', startDate);
      params = params.set('endDate', endDate);
      params = params.set('event_id', event_id);
      this.fetchRankForm(params);
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
    if (tabIdx === 0) {
      paramDatas = {
        pageNumber: this.meta.currentPage,
        startDate: this.startDate,
        endDate: this.endDate,
        mapId: this.mapId,
        groupId: this.groupId
      };
    } else {
      const { event_id, session_id } = this.rankTabs[tabIdx - 1];
      paramDatas = {
        pageNumber: this.meta.currentPage,
        mapId: this.mapId,
        groupId: this.groupId,
        eventId: event_id,
        sessionId: session_id
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
    if (this.tabIdx > 0) {
      const { time_stamp_start, time_stamp_end, is_real_time } = this.rankTabs[
        this.tabIdx - 1
      ];

      paramDatas = {
        date: this.date,
        mapId: this.mapId,
        userId,
        event: '1',
        start_time: time_stamp_start,
        end_time: time_stamp_end
      };
      if (is_real_time === 0) {
        paramDatas.event = '0';
      }
    }
    const mapInfoUrl = `${location.pathname}/mapInfo?${buildUrlQueryStrings(paramDatas)}`;

    this.router.navigateByUrl(mapInfoUrl);
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
        params = params.set(
          'startDate',
          moment(time_stamp_start * 1000).format('YYYY-MM-DD')
        );
        params = params.set(
          'endDate',
          moment(time_stamp_end * 1000).format('YYYY-MM-DD')
        );
        params = params.set('event_id', event_id);
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
      if (this.userName && this.emailOptions.length > 1) {
        this.emailOptions.push(this.tempEmail);
      }
      this.userName = this.emailOptions[index];
      if (this.emailOptions.length > 1) {
        this.tempEmail = this.emailOptions.splice(index, 1).toString();
      }
    }
  }
  preMap() {
    clearInterval(this.timer);
    if (this.tabIdx === 0) {
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
    } else {
      this.idx = this.customMapOptions.findIndex(
        _data => _data.map_id === Number(this.mapId)
      );
      if (this.idx - 1 === -1) {
        this.idx = this.customMapOptions.length - 1;
      } else {
        this.idx--;
      }
      this.mapId = this.customMapOptions[this.idx].map_id;
      this.distance = this.customMapOptions[this.idx].distance;

      this.mapName = this.customMapOptions[this.idx].map_name;
      this.bgImageUrl = `url(${mapImages[this.mapId - 1]})`;
    }
    let params = new HttpParams();
    params = params.set('mapId', this.mapId.toString());
    if (this.groupId !== '2') {
      params = params.set('gender', this.groupId);
    }
    if (this.userName) {
      params = params.set('userName', this.userName.trim());
    }
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
        this.fetchRealTimeRank(params);
        this.timer = setInterval(() => {
          if (this.tabIdx !== 0 && this.tabIdx !== 1) {
            this.fetchRealTimeRank(params);
          }
        }, 300000);
      } else {
        this.finalEventDate = moment(time_stamp_end * 1000).format(
          'YYYY-MM-DD'
        );
        params = params.set(
          'startDate',
          moment(time_stamp_start * 1000).format('YYYY-MM-DD')
        );
        params = params.set('endDate', this.finalEventDate);
        params = params.set('event_id', event_id);
        this.fetchRankForm(params);
      }
    } else {
      params = params.set('startDate', this.startDate);
      params = params.set('endDate', this.endDate);
      this.fetchRankForm(params);
    }
  }
  nextMap() {
    clearInterval(this.timer);
    if (this.tabIdx === 0) {
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
    } else {
      this.idx = this.customMapOptions.findIndex(
        _data => _data.map_id === Number(this.mapId)
      );
      if (this.idx + 1 > this.customMapOptions.length - 1) {
        this.idx = 0;
      } else {
        this.idx++;
      }
      this.mapId = this.customMapOptions[this.idx].map_id;
      this.distance = this.customMapOptions[this.idx].distance;

      this.mapName = this.customMapOptions[this.idx].map_name;
      this.bgImageUrl = `url(${mapImages[this.mapId - 1]})`;
    }
    let params = new HttpParams();
    params = params.set('mapId', this.mapId.toString());
    if (this.groupId !== '2') {
      params = params.set('gender', this.groupId);
    }
    if (this.userName) {
      params = params.set('userName', this.userName.trim());
    }
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
        this.fetchRealTimeRank(params);
        this.timer = setInterval(() => {
          if (this.tabIdx !== 0 && this.tabIdx !== 1) {
            this.fetchRealTimeRank(params);
          }
        }, 300000);
      } else {
        this.finalEventDate = moment(time_stamp_end * 1000).format(
          'YYYY-MM-DD'
        );
        params = params.set(
          'startDate',
          moment(time_stamp_start * 1000).format('YYYY-MM-DD')
        );
        params = params.set('endDate', this.finalEventDate);
        params = params.set('event_id', event_id);
        this.fetchRankForm(params);
      }
    } else {
      this.finalEventDate = '';
      params = params.set('startDate', this.startDate);
      params = params.set('endDate', this.endDate);
      this.fetchRankForm(params);
    }
  }
  selectMap(id) {
    this.globalEventsManager.getMapId(id);
  }
  clear() {
    this.userName = '';
    this.isClearIconShow = false;
  }
  selectTab(idx) {
    clearInterval(this.timer);
    this.tabIdx = idx;
    let params = new HttpParams();
    this.globalEventsManager.getTabIdx(this.tabIdx);
    if (this.groupId !== '2') {
      params = params.set('gender', this.groupId);
    }
    this.handleCoustomMaps();
    this.handleGetRankForm(params);
  }
}
