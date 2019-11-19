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
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '@shared/services/auth.service';
import { IMyDpOptions } from 'mydatepicker';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '../../shared/services/utils.service';
import { DetectInappService } from '@shared/services/detect-inapp.service';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';

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
    disableUntil: { year: 2017, month: 12, day: 31 },
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
  tabIdx = 0;
  isEmailSearch = true;
  rankTabs: any;
  timer: any;
  isRealTime: boolean;
  customMapOptions = [];
  isIntroducePage: boolean;
  isAlphaVersion = false;
  isPreviewMode = false;
  hideNavbar = false;  // 隱藏navbar-Kidin-1081023
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private globalEventsManager: GlobalEventsManager,
    private rankFormService: RankFormService,
    private utilsService: UtilsService,
    public translateService: TranslateService,
    private detectInappService: DetectInappService,
    private dialog: MatDialog
  ) {
    if (location.search.indexOf('ipm=s') > -1) {
      this.isPreviewMode = true;
    }
    this.handleSearchEmail = debounce(this.handleSearchEmail, 1000);
  }

  ngOnInit() {
    this.translateService.onLangChange.subscribe(() => {

      // 若非使用Line或其他App或IE以外瀏覽器時，跳出解析度警示框-Kidin-1081023
      if (this.detectInappService.isIE) {
        if (this.detectInappService.isLine || this.detectInappService.isInApp) {
          if (location.search.length === 0) {
            location.href += '?openExternalBrowser=1';
          } else {
            location.href += '&openExternalBrowser=1';
          }
        } else {
          this.dialog.open(MessageBoxComponent, {
            hasBackdrop: true,
            data: {
              title: 'message',
              body: this.translateService.instant('SH.browserError'),
              confirmText: this.translateService.instant('SH.determine')
            }
          });
        }
      }
    });

    // 藉由query string判斷是否隱藏Header-Kidin-1081023
    if (this.route.snapshot.queryParamMap.get('navbar') === '0') {
      this.hideNavbar = true;
    }

    if (location.hostname.indexOf('cloud.alatech.com.tw') > -1) {
      this.isAlphaVersion = false;
    } else {
      this.isAlphaVersion = true;
    }
    if (
      this.router.url === '/' ||
      this.router.url === '/?openExternalBrowser=1' ||
      this.router.url === '/#connect' ||
      this.router.url === '/#cloudrun' ||
      this.router.url === '/#trainlive' ||
      this.router.url === '/#fitness'
    ) {
      this.isIntroducePage = true;
    } else {
      this.isIntroducePage = false;
    }
    let browserLang = this.utilsService.getLocalStorageObject('locale');
    if (!browserLang) {
      browserLang = this.translateService.getBrowserCultureLang().toLowerCase();
      const currentLocales = ['zh-tw', 'zh-cn', 'en-us', 'es-es'];  // 新增西班牙語系-kidin-1081106
      if (currentLocales.findIndex(_locale => _locale === browserLang) === -1) {
        browserLang = 'en-us'; // default en-us
      }
      this.translateService.use(browserLang);
      this.utilsService.setLocalStorageObject('locale', browserLang);
    } else {
      this.translateService.use(browserLang);
    }
    this.startDate = this.convertDateString(this.startDay);
    this.endDate = this.convertDateString(this.finalDay);
    this.globalEventsManager.showNavBarEmitter.subscribe(mode => {
      this.isMaskShow = mode;
    });
    this.globalEventsManager.showCollapseEmitter.subscribe(mode => {
      this.isCollapseOpen = mode;
      if (this.isCollapseOpen) {
        const { sessionId } = getUrlQueryStrings(location.search);
        if (sessionId) {
          this.isEventTab = true;
          const idx = this.rankTabs.findIndex(
            _tab => _tab.session_id.toString() === sessionId
          );
          this.tabIdx = idx + 1;
        } else {
          this.isEventTab = false;
        }
      }
    });
    this.globalEventsManager.getMapOptionsEmitter.subscribe(options => {
      const { mapDatas, customMapOptions } = options;
      if (mapDatas) {
        this.mapDatas = mapDatas;
      }
      if (customMapOptions) {
        this.customMapOptions = customMapOptions;
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
  handleGetRankForm(params) {
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
    if (!selectedStartDate && !selectedEndDate) {
      const { endDate, startDate } = getUrlQueryStrings(location.search);
      this.startDate = startDate;
      this.endDate = endDate;
    } else {
      this.startDate = this.convertDateString(selectedStartDate);
      this.endDate = this.convertDateString(selectedEndDate);
    }
    this.startDay = this.convertDateFormat(selectedStartDate);
    this.finalDay = this.convertDateFormat(selectedEndDate);

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
    this.handleGetRankForm(params);
  }
  convertDateString(_date) {
    if (_date) {
      const {
        date: { day, month, year }
      } = _date;
      return year.toString() + '-' + month.toString() + '-' + day.toString();
    }
    const ans =
      new Date().getFullYear() +
      '-' +
      Number(new Date().getMonth() + 1) +
      '-' +
      new Date().getUTCDate();
    return ans;
  }
  convertDateFormat(_date) {
    if (_date) {
      const {
        date: { day, month, year }
      } = _date;
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
      this.rankDatas.map((_data, idx) => {
        if (idx > 0) {
          if (this.rankDatas[idx - 1].offical_time === _data.offical_time) {
            _data.rank = this.rankDatas[idx - 1].rank;
          } else {
            _data.rank = this.rankDatas[idx - 1].rank + 1;
          }
        } else {
          _data.rank = 1;
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
      const sessionId = this.rankTabs[this.tabIdx - 1].session_id;
      paramDatas = {
        pageNumber: this.meta.currentPage,
        mapId: this.mapId,
        groupId: this.groupId,
        eventId,
        sessionId
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
  handleSignin(e) {
    e.preventDefault();
    this.isIntroducePage = false;
    this.router.navigateByUrl('/signin');
  }
}
