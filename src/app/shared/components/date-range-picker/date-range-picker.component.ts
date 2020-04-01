import { Component, OnInit, Output, OnChanges, EventEmitter, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as $ from 'jquery';
import * as moment from 'moment';
import 'daterangepicker';

@Component({
  selector: 'app-date-range-picker',
  templateUrl: './date-range-picker.component.html',
  styleUrls: ['./date-range-picker.component.scss']
})
export class DateRangePickerComponent implements OnInit, OnChanges {

  @Output() selectDateRange: EventEmitter<any> = new EventEmitter();
  @Input() default: string;

  // 預設上週-kidin-1090330
  defaultDate = {
    startDate: moment().subtract(1, 'week').startOf('week').format('YYYY-MM-DDT00:00:00.000Z'),
    endDate: moment().subtract(1, 'week').endOf('week').format('YYYY-MM-DDT23:59:59.999Z')
  };

  dateRangePicker: object;

  constructor(
    private translate: TranslateService
  ) { }

  ngOnInit() {

    // 預設上週-kidin-1090330
    $('input[name="dates"]').daterangepicker({
      startDate: moment(this.defaultDate.startDate),
      endDate: moment(this.defaultDate.endDate),
      minYear: 2010,
      maxDate: moment(),
      locale: {
        format: 'YYYY/MM/DD'
      },
      ranges: {
        [this.translate.instant('other.today')]: [moment(), moment()],
        [this.translate.instant('Dashboard.GroupClass.last7Days')]: [moment().subtract(6, 'days'), moment()],
        [this.translate.instant('Dashboard.GroupClass.last30Days')]: [moment().subtract(29, 'days'), moment()],
        [this.translate.instant('other.thisWeek')]: [moment().startOf('week'), moment().endOf('week')],
        [this.translate.instant('other.lastWeek')]:
          [moment().subtract(1, 'week').startOf('week'), moment().subtract(1, 'week').endOf('week')],
        [this.translate.instant('other.thisMonth')]:
          [moment().startOf('month'), moment().endOf('month')],
        [this.translate.instant('other.lastMonth')]:
          [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
      },
     showCustomRangeLabel: false,
     alwaysShowCalendars: true
    });

    $('input[name="dates"]').on('apply.daterangepicker', this.emitDateRange.bind(this));
  }

  ngOnChanges () {
    this.getDefaultDate();
    this.selectDateRange.emit(this.defaultDate);
  }

  // 取得預設日期-kidin-1090331
  getDefaultDate () {
    switch (this.default) {
      case 'today':
        this.defaultDate = {
          startDate: moment().format('YYYY-MM-DDT00:00:00.000Z'),
          endDate: moment().format('YYYY-MM-DDT23:59:59.999Z')
        };
        break;
      case 'last7Days':
        this.defaultDate = {
          startDate: moment().subtract(6, 'days').format('YYYY-MM-DDT00:00:00.000Z'),
          endDate: moment().format('YYYY-MM-DDT23:59:59.999Z')
        };
        break;
      case 'lastWeek':
        this.defaultDate = {
          startDate: moment().subtract(1, 'week').startOf('week').format('YYYY-MM-DDT00:00:00.000Z'),
          endDate: moment().subtract(1, 'week').endOf('week').format('YYYY-MM-DDT23:59:59.999Z')
        };
        break;
      case 'last30Days':
        this.defaultDate = {
          startDate: moment().subtract(29, 'days').format('YYYY-MM-DDT00:00:00.000Z'),
          endDate: moment().format('YYYY-MM-DDT23:59:59.999Z')
        };
        break;
    }
  }

  // 發送日期區間給父組件-kidin-1090330
  emitDateRange (event, picker) {
    const dateRange = {
      startDate: picker.startDate.format('YYYY-MM-DDT00:00:00.000Z'),
      endDate: picker.endDate.format('YYYY-MM-DDT23:59:59.999Z')
    };

    this.selectDateRange.emit(dateRange);
  }

}
