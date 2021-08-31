import { Component, OnInit, Output, OnChanges, EventEmitter, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import jquery from 'jquery';
import moment from 'moment';
import 'daterangepicker';
import { AUTO_STYLE } from '@angular/animations';

@Component({
  selector: 'app-date-range-picker',
  templateUrl: './date-range-picker.component.html',
  styleUrls: ['./date-range-picker.component.scss']
})
export class DateRangePickerComponent implements OnInit, OnChanges {

  @Output() selectDateRange: EventEmitter<any> = new EventEmitter();
  @Input() default: string;
  @Input() pickerType: string;
  @Input() refStartDate: string;
  @Input() startTimeStamp: number;
  @Input() endTimeStamp: number;
  @Input() noBorder = false;
  @Input() openLeft = false;
  @Input() openPicker: boolean;
  @Input() limitMax: boolean;
  @Input() maxWidth: string;
  @Input() selectBirthday: boolean = false;

  // 預設上週-kidin-1090330
  defaultDate = {
    startDate: moment().subtract(1, 'week').startOf('week').format('YYYY-MM-DDT00:00:00.000Z'),
    endDate: moment().subtract(1, 'week').endOf('week').format('YYYY-MM-DDT23:59:59.999Z')
  };

  displayValue = {
    single: '',
    range: ''
  };

  dateRangePicker: object;

  constructor(
    private translate: TranslateService
  ) { }

  ngOnInit() {}

  ngOnChanges (e) {
    this.getDefaultDate();
    this.translate.get('hello.world').subscribe(() => {

      let pickerOpt: object;
      switch (this.pickerType) {
        case 'singlePicker': // 單一日期選擇器
          pickerOpt = {
            singleDatePicker: true,
            showDropdowns: true,
            startDate: moment(this.refStartDate),
            endDate: moment(this.refStartDate),
            drops: 'auto',
            locale: {
              format: 'YYYY-MM-DD'
            },
            showCustomRangeLabel: false,
            alwaysShowCalendars: true
          };

          if (!this.selectBirthday) {
            pickerOpt = {
              minYear: +moment().format('YYYY'),
              minDate: moment(),
              ranges: {
                [`1 ${this.translate.instant('universal_time_month')}`]:
                  [moment(this.refStartDate).subtract(-1, 'month'), moment(this.refStartDate).subtract(-1, 'month')],
                [`2 ${this.translate.instant('universal_time_month')}`]:
                  [moment(this.refStartDate).subtract(-2, 'month'), moment(this.refStartDate).subtract(-2, 'month')],
                [`3 ${this.translate.instant('universal_time_month')}`]:
                  [moment(this.refStartDate).subtract(-3, 'month'), moment(this.refStartDate).subtract(-3, 'month')],
                [`6 ${this.translate.instant('universal_time_month')}`]:
                  [moment(this.refStartDate).subtract(-6, 'month'), moment(this.refStartDate).subtract(-6, 'month')],
                [`1 ${this.translate.instant('universal_time_year')}`]:
                  [moment(this.refStartDate).subtract(-1, 'year'), moment(this.refStartDate).subtract(-1, 'year')],
                [`2 ${this.translate.instant('universal_time_year')}`]:
                  [moment(this.refStartDate).subtract(-2, 'year'), moment(this.refStartDate).subtract(-2, 'year')]
              },
              ...pickerOpt
            };

          } else {
            const minDate = moment().subtract(120, 'years').startOf('year');
            pickerOpt = {
              minYear: +minDate.format('YYYY'),
              minDate: minDate,
              ...pickerOpt
            };

          }

          break;
        case 'simpleSinglePicker': // 單一日期選擇器(無快速選擇自訂日期區間)
          pickerOpt = {
            singleDatePicker: true,
            showDropdowns: true,
            minYear: +moment().format('YYYY'),
            minDate: moment(),
            startDate: moment(this.defaultDate.startDate),
            endDate: moment(this.defaultDate.startDate),
            drops: 'auto',
            locale: {
              format: 'YYYY-MM-DD'
            },
            showCustomRangeLabel: false,
            alwaysShowCalendars: true
          }
          break;
        case 'rangePick': // 範圍日期選擇器(無快速選擇自訂日期區間)
          pickerOpt = {
            startDate: moment(this.defaultDate.startDate),
            endDate: moment(this.defaultDate.endDate),
            minYear: 2010,
            locale: {
              format: 'YYYY-MM-DD'
            },
            showCustomRangeLabel: false,
            alwaysShowCalendars: true
          }
          break;
        default: // 預設範圍日期選擇器
          pickerOpt = {
            startDate: moment(this.defaultDate.startDate),
            endDate: moment(this.defaultDate.endDate),
            minYear: 2010,
            maxDate: moment(),
            locale: {
              format: 'YYYY-MM-DD'
            },
            ranges: {
              [this.translate.instant('universal_time_today')]: [moment(), moment()],
              [this.translate.instant('universal_time_last7Days')]: [moment().subtract(6, 'days'), moment()],
              [this.translate.instant('universal_time_last30Days')]: [moment().subtract(29, 'days'), moment()],
              [this.translate.instant('universal_time_thisWeek')]: [moment().startOf('week'), moment().endOf('week')],
              [this.translate.instant('universal_time_lastWeek')]:
                [moment().subtract(1, 'week').startOf('week'), moment().subtract(1, 'week').endOf('week')],
              [this.translate.instant('universal_time_thisMonth')]:
                [moment().startOf('month'), moment().endOf('month')],
              [this.translate.instant('universal_time_lastMonth')]:
                [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            },
            showCustomRangeLabel: false,
            alwaysShowCalendars: true
          }
          break;

      }

      if (this.openLeft) {
        Object.assign(pickerOpt, {opens: 'left'});
      }

      if (this.limitMax) {
        Object.assign(pickerOpt, {maxDate: moment()})
      }

      jquery('input[name="dates"]').daterangepicker(pickerOpt);
      jquery('input[name="dates"]').on('apply.daterangepicker', this.emitDateRange.bind(this));
      if (this.openPicker) {
        const picker = document.getElementById('picker');
        picker.click();
      } else if (this.openPicker === undefined) {
        this.selectDateRange.emit(this.defaultDate);
      }
      
    });
    
  }

  // 取得預設日期-kidin-1090331
  getDefaultDate () {
    if (this.default) {

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
        case 'nextDay':
          this.defaultDate = {
            startDate: moment().subtract(-1, 'days').format('YYYY-MM-DDT00:00:00.000Z'),
            endDate: moment().subtract(-1, 'days').format('YYYY-MM-DDT23:59:59.999Z')
          };
          break;
        case 'nextMonth': // 曆期下個月
          this.defaultDate = {
            startDate: moment().subtract(-1, 'month').startOf('month').format('YYYY-MM-DDT00:00:00.000Z'),
            endDate: moment().subtract(-1, 'month').endOf('month').format('YYYY-MM-DDT23:59:59.999Z')
          };
          break;
        case 'nextYear':
          this.defaultDate = {
            startDate: moment().subtract(-1, 'year').format('YYYY-MM-DDT00:00:00.000Z'),
            endDate: moment().subtract(-1, 'year').format('YYYY-MM-DDT23:59:59.999Z')
          };
          break;
        default:
          let [startDate, endDate] = this.default.split('_');
          if (!endDate) endDate = moment().format('YYYY-MM-DDT23:59:59.999Z');
          this.defaultDate = {
            startDate: moment(startDate).format('YYYY-MM-DDT00:00:00.000Z'),
            endDate: moment(endDate).format('YYYY-MM-DDT23:59:59.999Z')
          };
          break;
      }

    } else {
      this.defaultDate = {
        startDate: moment(this.startTimeStamp).format('YYYY-MM-DDT00:00:00.000Z'),
        endDate: moment(this.endTimeStamp).format('YYYY-MM-DDT23:59:59.999Z')
      };

    }

  }

  // 發送日期區間給父組件-kidin-1090330
  emitDateRange (event, picker) {
    if (this.openPicker === undefined || this.openPicker) {
      const dateRange = {
        startDate: picker.startDate.format('YYYY-MM-DDT00:00:00.000Z'),
        endDate: picker.endDate.format('YYYY-MM-DDT23:59:59.999Z')
      };

      this.selectDateRange.emit(dateRange);
    }

  }

}
