import { Component, OnInit, Output, OnChanges, OnDestroy, EventEmitter, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import jquery from 'jquery';
import dayjs from 'dayjs';
import 'daterangepicker';

@Component({
  selector: 'app-date-range-picker',
  templateUrl: './date-range-picker.component.html',
  styleUrls: ['./date-range-picker.component.scss']
})
export class DateRangePickerComponent implements OnInit, OnChanges, OnDestroy {

  @Output() selectDateRange: EventEmitter<any> = new EventEmitter();
  @Input() default: string;
  @Input() pickerType: string;
  @Input() refStartDate: string;
  @Input() startTimeStamp: number;
  @Input() endTimeStamp: number;
  @Input() editStyle: string;
  @Input() openLeft = false;
  @Input() openPicker: boolean;
  @Input() limitMin: number;
  @Input() limitMax: number;
  @Input() limitMaxCurrent: boolean;
  @Input() selectBirthday: boolean = false;
  @Input() serialId: string = '';

  // 預設上週-kidin-1090330
  defaultDate = {
    startDate: dayjs().subtract(1, 'week').startOf('week').format('YYYY-MM-DDT00:00:00.000Z'),
    endDate: dayjs().subtract(1, 'week').endOf('week').format('YYYY-MM-DDT23:59:59.999Z')
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
            startDate: dayjs(this.refStartDate),
            endDate: dayjs(this.refStartDate),
            drops: 'auto',
            locale: {
              format: 'YYYY-MM-DD'
            },
            showCustomRangeLabel: false,
            alwaysShowCalendars: true
          };

          if (!this.selectBirthday) {
            pickerOpt = {
              minYear: +dayjs().format('YYYY'),
              minDate: dayjs(),
              ranges: {
                [`1 ${this.translate.instant('universal_time_month')}`]:
                  [dayjs(this.refStartDate).subtract(-1, 'month'), dayjs(this.refStartDate).subtract(-1, 'month')],
                [`2 ${this.translate.instant('universal_time_month')}`]:
                  [dayjs(this.refStartDate).subtract(-2, 'month'), dayjs(this.refStartDate).subtract(-2, 'month')],
                [`3 ${this.translate.instant('universal_time_month')}`]:
                  [dayjs(this.refStartDate).subtract(-3, 'month'), dayjs(this.refStartDate).subtract(-3, 'month')],
                [`6 ${this.translate.instant('universal_time_month')}`]:
                  [dayjs(this.refStartDate).subtract(-6, 'month'), dayjs(this.refStartDate).subtract(-6, 'month')],
                [`1 ${this.translate.instant('universal_time_year')}`]:
                  [dayjs(this.refStartDate).subtract(-1, 'year'), dayjs(this.refStartDate).subtract(-1, 'year')],
                [`2 ${this.translate.instant('universal_time_year')}`]:
                  [dayjs(this.refStartDate).subtract(-2, 'year'), dayjs(this.refStartDate).subtract(-2, 'year')]
              },
              ...pickerOpt
            };

          } else {
            const minDate = dayjs().subtract(120, 'year').startOf('year');
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
            minYear: +dayjs().format('YYYY'),
            minDate: dayjs(),
            startDate: dayjs(this.defaultDate.startDate),
            endDate: dayjs(this.defaultDate.startDate),
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
            startDate: dayjs(this.defaultDate.startDate),
            endDate: dayjs(this.defaultDate.endDate),
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
            startDate: dayjs(this.defaultDate.startDate),
            endDate: dayjs(this.defaultDate.endDate),
            minYear: 2010,
            maxDate: dayjs(),
            locale: {
              format: 'YYYY-MM-DD'
            },
            ranges: {
              [this.translate.instant('universal_time_today')]: [dayjs(), dayjs()],
              [this.translate.instant('universal_time_last7Days')]: [dayjs().subtract(6, 'day'), dayjs()],
              [this.translate.instant('universal_time_last30Days')]: [dayjs().subtract(29, 'day'), dayjs()],
              [this.translate.instant('universal_time_thisWeek')]: [dayjs().startOf('week'), dayjs().endOf('week')],
              [this.translate.instant('universal_time_lastWeek')]:
                [dayjs().subtract(1, 'week').startOf('week'), dayjs().subtract(1, 'week').endOf('week')],
              [this.translate.instant('universal_time_thisMonth')]:
                [dayjs().startOf('month'), dayjs().endOf('month')],
              [this.translate.instant('universal_time_lastMonth')]:
                [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')]
            },
            showCustomRangeLabel: false,
            alwaysShowCalendars: true
          }
          break;

      }

      if (this.openLeft) {
        pickerOpt = {
          opens: 'left',
          ...pickerOpt
        };

      }

      if (this.limitMin) {
        Object.assign(pickerOpt, {
          minDate: dayjs(this.limitMin)
        });

      }

      if (this.limitMax || this.limitMaxCurrent) {
        Object.assign(pickerOpt, {
          maxDate: this.limitMax ? dayjs(this.limitMax) : dayjs()
        });
        
      }

      setTimeout(() => {
        
        jquery(`#picker${this.serialId}`).daterangepicker(pickerOpt);
        jquery(`#picker${this.serialId}`).on('apply.daterangepicker', this.emitDateRange.bind(this));
        if (this.openPicker) {
          const id = this.serialId ? `picker${this.serialId}` : 'picker';
          const picker = document.getElementById(id);
          picker.click();
        } else if (this.openPicker === undefined) {
          this.selectDateRange.emit(this.defaultDate);
        }

      });
      
    });
    
  }

  // 取得預設日期-kidin-1090331
  getDefaultDate () {
    if (this.default) {

      switch (this.default) {
        case 'today':
          this.defaultDate = {
            startDate: dayjs().format('YYYY-MM-DDT00:00:00.000Z'),
            endDate: dayjs().format('YYYY-MM-DDT23:59:59.999Z')
          };
          break;
        case 'last7Days':
          this.defaultDate = {
            startDate: dayjs().subtract(6, 'day').format('YYYY-MM-DDT00:00:00.000Z'),
            endDate: dayjs().format('YYYY-MM-DDT23:59:59.999Z')
          };
          break;
        case 'lastWeek':
          this.defaultDate = {
            startDate: dayjs().subtract(1, 'week').startOf('week').format('YYYY-MM-DDT00:00:00.000Z'),
            endDate: dayjs().subtract(1, 'week').endOf('week').format('YYYY-MM-DDT23:59:59.999Z')
          };
          break;
        case 'last30Days':
          this.defaultDate = {
            startDate: dayjs().subtract(29, 'day').format('YYYY-MM-DDT00:00:00.000Z'),
            endDate: dayjs().format('YYYY-MM-DDT23:59:59.999Z')
          };
          break;
        case 'nextDay':
          this.defaultDate = {
            startDate: dayjs().subtract(-1, 'day').format('YYYY-MM-DDT00:00:00.000Z'),
            endDate: dayjs().subtract(-1, 'day').format('YYYY-MM-DDT23:59:59.999Z')
          };
          break;
        case 'nextMonth': // 曆期下個月
          this.defaultDate = {
            startDate: dayjs().subtract(-1, 'month').startOf('month').format('YYYY-MM-DDT00:00:00.000Z'),
            endDate: dayjs().subtract(-1, 'month').endOf('month').format('YYYY-MM-DDT23:59:59.999Z')
          };
          break;
        case 'nextYear':
          this.defaultDate = {
            startDate: dayjs().subtract(-1, 'year').format('YYYY-MM-DDT00:00:00.000Z'),
            endDate: dayjs().subtract(-1, 'year').format('YYYY-MM-DDT23:59:59.999Z')
          };
          break;
        default:
          let [startDate, endDate] = this.default.split('_');
          if (!endDate) endDate = dayjs(startDate).format('YYYY-MM-DDT23:59:59.999Z');
          this.defaultDate = {
            startDate: dayjs(startDate).format('YYYY-MM-DDT00:00:00.000Z'),
            endDate: dayjs(endDate).format('YYYY-MM-DDT23:59:59.999Z')
          };
          break;
      }

    } else {
      this.defaultDate = {
        startDate: dayjs(this.startTimeStamp).format('YYYY-MM-DDT00:00:00.000Z'),
        endDate: dayjs(this.endTimeStamp).format('YYYY-MM-DDT23:59:59.999Z')
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

  /**
   * 移除創建的日期選擇器
   */
  removePicker() {
    if (!this.serialId) jquery('.daterangepicker').remove();    
  }


  ngOnDestroy() {
    this.removePicker();
  }

}
