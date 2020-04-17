import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy
} from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import * as moment from 'moment';
import * as _Highcharts from 'highcharts';
import { ReportService } from '../../services/report.service';

const Highcharts: any = _Highcharts; // 不檢查highchart型態

@Component({
  selector: 'app-sport-report',
  templateUrl: './sport-report.component.html',
  styleUrls: ['./sport-report.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SportReportComponent implements OnInit, OnDestroy {
  @Output() showPrivacyUi = new EventEmitter();

  isPreviewMode = false;
  chooseType = '99';
  timeType = 0;
  filterStartTime: string;
  filterEndTime: string;
  reportStartTime: string;
  reportEndTime: string;
  today = moment().format('YYYY/MM/DD');
  endWeekDay = moment()
    .add(6 - +moment().format('d'), 'days')
    .format('YYYY/MM/DD');
  datas = [];
  periodTimes = [];
  isLoading = false;
  timeZoneStr = '';
  selectedIndex = 0;

  constructor(
    private reportService: ReportService
  ) {
    this.filterEndTime = moment().format('YYYY/MM/DD');
    this.filterStartTime = moment()
      .subtract(6, 'days')
      .format('YYYY/MM/DD');
  }

  ngOnInit() {
    // 確認是否為預覽列印頁面-kidin-1090205
    if (location.search.indexOf('ipm=s') > -1) {
      this.isPreviewMode = true;
    }

    // 確認url是否有query string-kidin-1090205
    this.getTimeZone();
    if (
      location.search.indexOf('sport=') > -1 &&
      location.search.indexOf('startdate=') > -1 &&
      location.search.indexOf('enddate=') > -1 &&
      location.search.indexOf('selectPeriod=') > -1
    ) {
      this.queryStringShowData();
    } else {
      this.reportEndTime = moment().format(`YYYY-MM-DDT23:59:59${this.timeZoneStr}`);
      this.reportStartTime = moment()
        .subtract(6, 'days')
        .format(`YYYY-MM-DDT00:00:00${this.timeZoneStr}`);

      this.reportService.setReportTime(this.reportStartTime, this.reportEndTime);
      this.reportService.setPeriod('7');

      this.generateTimePeriod();
    }
  }

  // 依query string顯示資料-kidin-20191226
  queryStringShowData () {
    const queryString = location.search.replace('?', '').split('&');
    for (let i = 0; i < queryString.length; i++) {
      if (queryString[i].indexOf('sport=') > -1) {
        this.handleRenderChart(queryString[i].replace('sport=', ''));
      } else if (queryString[i].indexOf('startdate=') > -1) {
        this.filterStartTime = queryString[i].replace('startdate=', '').replace(/-/g, '/');
        this.reportStartTime = moment(queryString[i]
          .replace('startdate=', ''), 'YYYY-MM-DD')
          .format(`YYYY-MM-DDT00:00:00${this.timeZoneStr}`);
      } else if (queryString[i].indexOf('enddate=') > -1) {
        this.filterEndTime = queryString[i].replace('enddate=', '').replace(/-/g, '/');
        this.reportEndTime = moment(queryString[i]
          .replace('enddate=', ''), 'YYYY-MM-DD')
          .format(`YYYY-MM-DDT23:59:59${this.timeZoneStr}`);
      } else if (queryString[i].indexOf('selectPeriod=') > -1) {
        this.reportService.setPeriod(queryString[i].replace('selectPeriod=', ''));
        switch (queryString[i].replace('selectPeriod=', '')) {
          case '7':
            this.selectedIndex = 0;
            this.changeGroupInfo(this.selectedIndex, 'url');
            break;
          case '30':
            this.selectedIndex = 1;
            this.changeGroupInfo(this.selectedIndex, 'url');
            break;
          case '182':
            this.selectedIndex = 2;
            this.changeGroupInfo(this.selectedIndex, 'url');
            break;
          default:
            this.selectedIndex = 3;
            this.changeGroupInfo(this.selectedIndex, 'url');
            break;
        }
      }
    }
    this.reportService.setReportTime(this.reportStartTime, this.reportEndTime);
  }

  // 取得當地時區並加以處理-kidin-1090205
  getTimeZone () {
    const timeZoneMinite = new Date();
    const timeZone = -(timeZoneMinite.getTimezoneOffset() / 60);
    if (timeZone < 10 && timeZone >= 0) {
      this.timeZoneStr = `+0${timeZone}:00`;
    } else if (timeZone > 10) {
      this.timeZoneStr = `+${timeZone}:00`;
    } else if (timeZone > -10 && timeZone < 0) {
      this.timeZoneStr = `-0${timeZone}:00`;
    } else {
      this.timeZoneStr = `-${timeZone}:00`;
    }
  }

  // 切換運動type-kidin-1090205
  handleRenderChart (type) {
    this.chooseType = type;
    this.reportService.setReportCategory(this.chooseType);
  }

  generateTimePeriod() {
    this.periodTimes = [];
    let stamp = moment(this.filterStartTime).unix();
    const stopDay = moment(this.filterEndTime).format('d');
    let stopTime = '';
    if (this.timeType === 2 || this.timeType === 3) {
      const stopTimeStamp =
        moment(this.filterEndTime)
          .subtract(stopDay, 'days')
          .unix() +
        86400 * 7;
      stopTime = moment.unix(stopTimeStamp).format('YYYY-MM-DD');
    } else {
      const stopStamp = moment(this.filterEndTime).unix() + 86400;
      stopTime = moment.unix(stopStamp).format('YYYY-MM-DD');
    }
    while (moment.unix(stamp).format('YYYY-MM-DD') !== stopTime) {
      if (this.timeType === 2 || this.timeType === 3) {
        this.periodTimes.push((stamp + 86400 * 6) * 1000);
        stamp = stamp + 86400 * 7;
      } else {
        this.periodTimes.push(stamp * 1000);
        stamp = stamp + 86400;
      }
    }
  }

  changeGroupInfo(e, method) {
    if (method === 'url') {
      this.timeType = e;
      if (this.timeType === 0) {
        this.reportService.setPeriod('7');
      } else if (this.timeType === 1) {
        this.reportService.setPeriod('30');
      } else if (this.timeType === 2) {
        this.reportService.setPeriod('182');
      } else {
        this.reportService.setPeriod('364');
      }
    } else {
      this.timeType = e.index;
      this.filterEndTime = moment().format('YYYY/MM/DD');
      const day = moment().format('d');
      if (this.timeType === 0) {
        this.filterStartTime = moment()
          .subtract(6, 'days')
          .format('YYYY/MM/DD');
        this.reportService.setPeriod('7');
      } else if (this.timeType === 1) {
        this.filterStartTime = moment()
          .subtract(29, 'days')
          .format('YYYY/MM/DD');
        this.reportService.setPeriod('30');
      } else if (this.timeType === 2) {
        this.filterStartTime = moment()
          .subtract(day, 'days')
          .subtract(26, 'weeks')
          .format('YYYY/MM/DD');
        this.filterEndTime = moment()
          .add(6 - +day, 'days')
          .format('YYYY/MM/DD');
        this.reportService.setPeriod('182');
      } else {
        this.filterStartTime = moment()
          .subtract(day, 'days')
          .subtract(52, 'weeks')
          .format('YYYY/MM/DD');
        this.filterEndTime = moment()
          .add(6 - +day, 'days')
          .format('YYYY/MM/DD');
        this.reportService.setPeriod('364');
      }
      this.generateTimePeriod();
      let filterEndTime = moment().format(`YYYY-MM-DDT23:59:59${this.timeZoneStr}`);

      let filterStartTime = '';
      if (this.timeType === 0) {
        filterStartTime = moment()
          .subtract(6, 'days')
          .format(`YYYY-MM-DDT00:00:00${this.timeZoneStr}`);
      } else if (this.timeType === 1) {
        filterStartTime = moment()
          .subtract(29, 'days')
          .format(`YYYY-MM-DDT00:00:00${this.timeZoneStr}`);
      } else if (this.timeType === 2) {
        filterStartTime = moment()
          .subtract(day, 'days')
          .subtract(26, 'weeks')
          .format(`YYYY-MM-DDT00:00:00${this.timeZoneStr}`);
        filterEndTime = moment()
          .add(6 - +day, 'days')
          .format(`YYYY-MM-DDT23:59:59${this.timeZoneStr}`);
      } else {
        filterStartTime = moment()
          .subtract(day, 'days')
          .subtract(52, 'weeks')
          .format(`YYYY-MM-DDT00:00:00${this.timeZoneStr}`);
        filterEndTime = moment()
          .add(6 - +day, 'days')
          .format(`YYYY-MM-DDT23:59:59${this.timeZoneStr}`);
      }

      this.reportStartTime = filterStartTime;
      this.reportEndTime = filterEndTime;
    }

    this.reportService.setReportTime(this.reportStartTime, this.reportEndTime);
  }

  shiftPreTime() {
    if (this.timeType === 0) {
      this.filterEndTime = moment(this.filterStartTime)
        .subtract(1, 'days')
        .format('YYYY/MM/DD');
      this.filterStartTime = moment(this.filterEndTime)
        .subtract(6, 'days')
        .format('YYYY/MM/DD');
    } else if (this.timeType === 1) {
      this.filterEndTime = moment(this.filterStartTime)
        .subtract(1, 'days')
        .format('YYYY/MM/DD');
      this.filterStartTime = moment(this.filterEndTime)
        .subtract(29, 'days')
        .format('YYYY/MM/DD');
    } else if (this.timeType === 2) {
      this.filterEndTime = moment(this.filterStartTime)
        .subtract(1, 'days')
        .format('YYYY/MM/DD');
      this.filterStartTime = moment(this.filterEndTime)
        .subtract(6, 'days')
        .subtract(26, 'weeks')
        .format('YYYY/MM/DD');
    } else {
      this.filterEndTime = moment(this.filterStartTime)
        .subtract(1, 'days')
        .format('YYYY/MM/DD');
      this.filterStartTime = moment(this.filterEndTime)
        .subtract(6, 'days')
        .subtract(52, 'weeks')
        .format('YYYY/MM/DD');
    }
    this.reportEndTime = moment(this.filterEndTime).format(
      `YYYY-MM-DDT23:59:59${this.timeZoneStr}`
    );
    this.reportStartTime = moment(this.filterStartTime).format(
      `YYYY-MM-DDT00:00:00${this.timeZoneStr}`
    );

    this.reportService.setReportTime(this.reportStartTime, this.reportEndTime);

    this.generateTimePeriod();
  }

  shiftNextTime() {
    if (
      this.filterEndTime !== this.today ||
      this.filterEndTime !== this.endWeekDay
    ) {
      if (this.timeType === 0) {
        this.filterStartTime = moment(this.filterEndTime)
          .add(1, 'days')
          .format('YYYY/MM/DD');
        this.filterEndTime = moment(this.filterStartTime)
          .add(6, 'days')
          .format('YYYY/MM/DD');
      } else if (this.timeType === 1) {
        this.filterStartTime = moment(this.filterEndTime)
          .add(1, 'days')
          .format('YYYY/MM/DD');
        this.filterEndTime = moment(this.filterStartTime)
          .add(29, 'days')
          .format('YYYY/MM/DD');
      } else if (this.timeType === 2) {
        this.filterStartTime = moment(this.filterEndTime)
          .add(1, 'days')
          .format('YYYY/MM/DD');
        this.filterEndTime = moment(this.filterStartTime)
          .add(6, 'days')
          .add(26, 'weeks')
          .format('YYYY/MM/DD');
      } else {
        this.filterStartTime = moment(this.filterEndTime)
          .add(1, 'days')
          .format('YYYY/MM/DD');
        this.filterEndTime = moment(this.filterStartTime)
          .add(6, 'days')
          .add(52, 'weeks')
          .format('YYYY/MM/DD');
      }
      this.reportEndTime = moment(this.filterEndTime).format(
        `YYYY-MM-DDT23:59:59${this.timeZoneStr}`
      );
      this.reportStartTime = moment(this.filterStartTime).format(
        `YYYY-MM-DDT00:00:00${this.timeZoneStr}`
      );

      this.reportService.setReportTime(this.reportStartTime, this.reportEndTime);

      this.generateTimePeriod();
    }
  }

  // 將隱私權pass給父組件-kidin-1090205
  emitPrivacy (e) {
    this.showPrivacyUi.emit(e);
  }

  ngOnDestroy () {
    // 頁面卸除時將所選類別改回全部類型(Bug 1149)，並將url reset避免污染其他頁面-kidin-1090325
    this.reportService.setReportCategory('99');
    window.history.pushState({path: location.pathname}, '', location.pathname);

    // 將之前生成的highchart卸除避免新生成的highchart無法顯示-kidin-1081219
    Highcharts.charts.forEach((_highChart, idx) => {
      if (_highChart !== undefined) {
        _highChart.destroy();
      }
    });

  }
}
