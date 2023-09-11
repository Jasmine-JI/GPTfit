import { CommonModule, NgFor, NgIf } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import {
  Api531Post,
  Api531Response,
  ExerciseHabitsService,
  monthGroup,
  typePercent,
  weekGroup,
} from '../../service/exercise-habits.service';
import {
  BorderRadius,
  Chart,
  ChartData,
  ChartOptions,
  CoreInteractionOptions,
} from 'chart.js/auto';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import dayjs from 'dayjs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DATE_LOCALE,
  MAT_DATE_FORMATS,
  MatNativeDateModule,
  DateAdapter,
} from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BreakpointObserver, LayoutModule } from '@angular/cdk/layout';
import zoomPlugin from 'chartjs-plugin-zoom';
import { ZoomPluginOptions } from 'chartjs-plugin-zoom/types/options';
import {
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
  MomentDateAdapter,
} from '@angular/material-moment-adapter';
Chart.register(zoomPlugin);

const DATE_FORMAT = {
  parse: {
    dateInput: 'YYYY-MM-DD',
  },
  display: {
    dateInput: 'YYYY-MM-DD',
    monthYearLabel: 'YYYY MMM',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY MMMM',
  },
};

@Component({
  selector: 'app-exercise-habits-trend-chart',
  templateUrl: './exercise-habits-trend-chart.component.html',
  styleUrls: ['./exercise-habits-trend-chart.component.scss'],
  standalone: true,
  imports: [
    TranslateModule,
    NgFor,
    NgIf,
    CommonModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    LayoutModule,
  ],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: DATE_FORMAT },
  ],
})
export class ExerciseHabitsTrendChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('svgContainer') svgContainer: ElementRef;
  @ViewChild('selectOption') selectOption: ElementRef;
  private languageChangeSubscription: Subscription;
  private exerciseHabitsSubscription: Subscription;

  /**
   *日期快速選單
   */
  dateOptions = {
    previousMonth: 'universal_time_previousMonth',
    past3Months: 'universal_time_last3Months',
    last6Months: 'universal_time_last6Months',
    thisYear: 'universal_time_thisYear',
    custom: 'universal_system_custom',
  };

  /**
   * ui 會用到的 flag
   */
  uiFlag = {
    isMonthUnit: false,
    isDateSelect: false,
    dateOption: this.dateOptions.past3Months,
  };

  /**
   * fetchAPI 所需條件
   * @type {Api531Post}
   */
  Api531Post: Api531Post;
  ifNoData: boolean;
  FilterStartTime: string;
  FilterEndTime: string;
  select_type: number; //自訂時間 1
  calculateType: string = this.exerciseHabitsService.calculateType;

  /**
   * 此圖所需資料
   *
   */
  api531Response: Api531Response;
  week_group: weekGroup;
  month_group: monthGroup;
  type_percent: typePercent;

  constructor(
    private exerciseHabitsService: ExerciseHabitsService,
    private translate: TranslateService,
    private breakpointObserver: BreakpointObserver,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.get531Response();
  }

  /**
   * Checks if the user is on a mobile device
   */
  get isMobile() {
    return this.breakpointObserver.isMatched('(max-width: 767px)');
  }

  @HostListener('document:click', ['$event'])
  handleClick(event: Event): void {
    event.stopPropagation();
    // 檢查點擊事件是否發生在 date_option 之外
    if (!this.selectOption.nativeElement.contains(event.target)) {
      this.uiFlag.isDateSelect = false;
    }
  }

  /**
   * 開啟快速日期選單
   */
  dateSelect() {
    this.uiFlag.isDateSelect = !this.uiFlag.isDateSelect;
  }

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  /**
   * 選擇快速日期
   * @param */
  dateOption(dateOption: string) {
    this.uiFlag.isDateSelect = false;
    this.uiFlag.dateOption = this.dateOptions[dateOption];
    switch (dateOption) {
      case 'previousMonth':
        this.changeOptionTime(
          dayjs().subtract(1, 'month').startOf('week').day(1).toDate(),
          dayjs().toDate()
        );
        break;
      case 'past3Months':
        this.changeOptionTime(
          dayjs().subtract(3, 'month').startOf('week').day(1).toDate(),
          dayjs().toDate()
        );
        break;
      case 'last6Months':
        this.changeOptionTime(
          dayjs().subtract(6, 'month').startOf('week').day(1).toDate(),
          dayjs().toDate()
        );
        break;
      case 'thisYear':
        this.changeOptionTime(
          dayjs().startOf('year').startOf('week').day(1).toDate(),
          dayjs().toDate()
        );
        break;
      default:
        break;
    }
  }

  /**
   *快速日期區間選單
   */
  changeOptionTime(optionStartTime: Date, optionEndTime: Date) {
    this.Api531Post.filterStartTime = dayjs(optionStartTime).format(
      'YYYY-MM-DDT00:00:00.000+08:00'
    );
    this.FilterStartTime = dayjs(optionStartTime).format('YYYY-MM-DD');
    this.Api531Post.filterEndTime = dayjs(optionEndTime).format('YYYY-MM-DDT23:59:59.999+08:00');
    this.FilterEndTime = dayjs(optionEndTime).format('YYYY-MM-DD');
    this.prefetchAPI();
  }

  /**
   * custom更改起始日
   */
  changeStartTime(FilterStartTime: Date) {
    this.uiFlag.dateOption = this.dateOptions.custom;
    this.Api531Post.filterStartTime = dayjs(FilterStartTime).format(
      'YYYY-MM-DDT00:00:00.000+08:00'
    );
    this.FilterStartTime = dayjs(FilterStartTime).format('YYYY-MM-DD');
    this.prefetchAPI();
  }

  /**
   * custom更改結束日
   */
  changeEndTime(FilterEndTime: Date) {
    this.uiFlag.dateOption = this.dateOptions.custom;
    this.Api531Post.filterEndTime = dayjs(FilterEndTime).format('YYYY-MM-DDT23:59:59.999+08:00');
    this.FilterEndTime = dayjs(FilterEndTime).format('YYYY-MM-DD');
    this.prefetchAPI();
  }

  prefetchAPI() {
    this.Api531Post.select_type = 1; // 更新 select_type
    this.Api531Post.calculateType = this.exerciseHabitsService.getCalculateType();
    this.fetchAPI();
  }

  checkIfNoData(response: any) {
    if (response.week_group == null) {
      this.ifNoData = true;
    } else {
      this.ifNoData = false;
      this.api531Response = response;
      this.getData(this.api531Response);
    }
  }

  fetchAPI() {
    this.ifNoData = false; //fetchAPI前，假設有資料
    this.exerciseHabitsSubscription = this.exerciseHabitsService
      .fetchExerciseHabits(this.Api531Post)
      .subscribe((response) => {
        this.checkIfNoData(response);
      });
  }

  /**
   * 取回已儲存的 531API Api531Post request
   */
  getApiRequest() {
    this.Api531Post = { ...this.exerciseHabitsService.getOriginalApiRequest() };
    this.FilterStartTime = dayjs(this.Api531Post.filterStartTime).format('YYYY-MM-DD');
    this.FilterEndTime = dayjs(this.Api531Post.filterEndTime).format('YYYY-MM-DD');
  }

  ngAfterViewInit() {
    this.languageChangeSubscription = this.translate.onLangChange.subscribe(() => {
      if (this.api531Response) {
        this.initChart();
      }
    });
  }

  /**
   * 取回已儲存的 531API response
   */
  get531Response() {
    this.getApiRequest();
    this.exerciseHabitsService.getIfNoDataObservable().subscribe((value) => {
      if (value === false) {
        //有運動資料
        this.ifNoData === false;
        this.exerciseHabitsService.get531Response().subscribe((response: Api531Response) => {
          this.api531Response = response;
          this.getData(response);
        });
      } else {
        this.ifNoData = true;
      }
    });
  }

  /**
   * 取得頁面所需資料
   * @param response
   */
  getData(response: any) {
    if (this.api531Response) {
      this.week_group = response.week_group;
      this.month_group = response.month_group;
      this.type_percent = response.type_percent;
      this.initChart();
    }
  }

  /**
   * 繪製圖表
   */
  initChart() {
    this.effectValue();
    this.calories();
    this.sportDayTime();
    this.getSvgValue();
  }

  /**
   * html 之運動種類百分比運算
   * @param type
   * @returns
   */
  getTypePercent(type: string) {
    if (this.type_percent) {
      const typeIndex = this.type_percent.type.indexOf(type);
      if (typeIndex !== -1) {
        return (this.type_percent.type_percent[typeIndex] * 100).toFixed(0);
      }
    }
    return '0'; //如果response沒有回傳對應運動種類占比，則顯示0
  }

  /**
   * 遍歷每個運動類型，更新對應的SVG元素屬性
   */
  getSvgValue() {
    const typeCodeToTypeMap = {
      '1': 'run',
      '2': 'bike',
      '3': 'weight',
      '4': 'swim',
      '5': 'aero',
      '6': 'row',
      '7': 'ball',
    };
    // 所有可能的運動類型代碼
    const allTypes = ['1', '2', '3', '4', '5', '6', '7'];

    if (this.type_percent) {
      // 對應每個運動類型的代碼與ID
      allTypes.forEach((typeCode) => {
        const type = typeCodeToTypeMap[typeCode]; // 根據代碼獲取運動類型ID
        const typeIndex = this.type_percent.type.indexOf(typeCode); // 獲取運動類型在type_percent中的索引
        const percent = typeIndex !== -1 ? this.type_percent.type_percent[typeIndex] : 0; // 如果typeIndex為-1，表示這個運動類型未回傳數據，將其視為0
        const value = percent * 100;

        // 更新對應的SVG元素屬性
        const barElement = document.getElementById(`${type}_bar`);
        const capElement = document.getElementById(`${type}_cap`);
        const capShadowElement = document.getElementById(`${type}_cap_shadow`);

        if (barElement) {
          barElement.setAttribute('y', (105 - value).toString());
          barElement.setAttribute('height', value.toString());
        }

        if (capElement) {
          capElement.setAttribute('cy', (105 - value).toString());
        }

        if (capShadowElement) {
          capShadowElement.setAttribute('y', (97 - value).toString());
        }
      });
    } else {
      // 對應每個運動類型的代碼與ID
      allTypes.forEach((typeCode) => {
        const type = typeCodeToTypeMap[typeCode]; // 根據代碼獲取運動類型ID
        const value = 0; // 如果typeIndex為-1，表示這個運動類型未回傳數據，將其視為0

        // 更新對應的SVG元素屬性
        const barElement = document.getElementById(`${type}_bar`);
        const capElement = document.getElementById(`${type}_cap`);
        const capShadowElement = document.getElementById(`${type}_cap_shadow`);

        if (barElement) {
          barElement.setAttribute('y', (105 - value).toString());
          barElement.setAttribute('height', value.toString());
        }

        if (capElement) {
          capElement.setAttribute('cy', (105 - value).toString());
        }

        if (capShadowElement) {
          capShadowElement.setAttribute('y', (97 - value).toString());
        }
      });
    }
  }

  /**
   * 變更是否使用isoWeek(週一為一週第一天)
   */
  changeWeekMonth() {
    this.uiFlag.isMonthUnit = !this.uiFlag.isMonthUnit;
    this.initChart();
  }

  /**
   *
   * 圖表縮放
   * @type {ZoomPluginOptions}
   */
  zoom: ZoomPluginOptions = {
    pan: {
      enabled: true,
      modifierKey: 'ctrl',
      mode: 'x',
      threshold: 10,
    },
    zoom: {
      wheel: {
        enabled: true,
        modifierKey: 'ctrl',
      },
      drag: {
        enabled: true,
      },
      pinch: {
        enabled: true,
      },
      mode: 'x',
    },
  };

  /**
   * bar 趨勢圖 BorderRadius
   *
   */
  borderRadius: BorderRadius = {
    topLeft: 10,
    topRight: 10,
    bottomLeft: 0,
    bottomRight: 0,
  };

  /**
   * 長條圖寬度設定
   */
  barOptions: any = {
    barPercentage: 0.8,
    maxBarThickness: 15,
    borderSkipped: 'start',
    borderWidth: 1,
  };

  interaction: CoreInteractionOptions = {
    mode: 'nearest',
    intersect: false,
    axis: 'x',
    includeInvisible: false,
  };

  sharedTooltipData = [];

  /**
   * 完成度圖
   */
  effectValue() {
    let xAxisData: string[];
    let yAxisData: number[];

    if (this.uiFlag.isMonthUnit) {
      // 根據月的資料更新 x 軸和 y 軸資料
      xAxisData = this.month_group.year_month;
      yAxisData = this.month_group.effect_value.map((value) => Math.round(value * 100));
    } else {
      // 根據周的資料更新 x 軸和 y 軸資料
      xAxisData = this.week_group.year_week_num;
      yAxisData = this.week_group.effect_value.map((value) => Math.round(value * 100));
    }

    const data = {
      labels: xAxisData,
      datasets: [
        {
          label: `${this.translate.instant('universal_lifeTracking_achievementRate')} (%)`,
          pointStyle: 'rect',
          data: yAxisData,
          borderColor: 'rgba(192, 163, 255, 1)',
          backgroundColor: 'rgba(255, 76, 151, 0.8)',

          borderRadius: this.borderRadius,
          barPercentage: this.barOptions.barPercentage,
          maxBarThickness: this.barOptions.maxBarThickness,
          borderSkipped: this.barOptions.borderSkipped,
          borderWidth: this.barOptions.borderWidth,
        },
      ],
    };

    const options: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: this.interaction,
      layout: {
        padding: {
          left: 5, // 左側間距
          right: 40, // 右側間距
        },
      },
      plugins: {
        legend: {
          display: true, // 不顯示標籤圖示
          align: 'start',
          onClick: null,
          labels: {
            usePointStyle: true,
          },
        },
        /** 游標提示元素的詳細信息 */
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw;
              return `${value}%`; // 在 tooltip 中添加百分比符号
            },
          },
        },
        //圖表縮放
        zoom: this.zoom,
      },
      scales: {
        y: {
          beginAtZero: true, // y轴从0开始
          min: 0,
          max: 100,
          ticks: {
            // callback: (value: number) => `${value}%`, // 刻度百分比符號
            stepSize: 25, // 刻度的间隔
          },
          // grid: {
          //   drawOnChartArea: false, // only want the grid lines for one axis to show up
          // },
          grid: {
            color: 'rgba(255,215,215,1)',
          },
          border: {
            dash: [10, 7],
          },
        },

        x: {
          grid: {
            drawOnChartArea: false, // only want the grid lines for one axis to show up
          },
          ticks: {
            maxTicksLimit: 5, // 指定要顯示的最大標籤數量
          },
        },
      },
    };

    const oldChart = Chart.getChart('effect_value');
    if (oldChart) {
      oldChart.destroy();
    }

    // 繪製新的圖表
    new Chart('effect_value', {
      type: 'bar',
      data: data,
      options: options, // 指定 options 物件來設定多個 Y 軸
    });
  }

  /**
   * 卡路里圖
   */
  calories() {
    let xAxisData: string[];
    let yAxisData: number[];

    function getparseFloat(value: number) {
      if (value < 100) {
        return parseFloat((value / 1000).toFixed(2));
      } else return parseFloat((value / 1000).toFixed(1));
    }

    if (this.uiFlag.isMonthUnit) {
      // 根據月的資料更新 x 軸和 y 軸資料
      xAxisData = this.month_group.year_month;
      yAxisData = this.month_group.sum_calories.map((value) => getparseFloat(value));
    } else {
      // 根據周的資料更新 x 軸和 y 軸資料
      xAxisData = this.week_group.year_week_num;
      yAxisData = this.week_group.sum_calories.map((value) => getparseFloat(value));
    }

    const data = {
      labels: xAxisData,
      datasets: [
        {
          label: `${this.translate.instant(
            'universal_userProfile_calories'
          )} (${this.translate.instant('universal_unit_calories')})`,
          pointStyle: 'rect',
          data: yAxisData,
          borderColor: 'rgba(192, 163, 255, 1)',
          backgroundColor: 'rgba(81, 202, 159, 1)',

          borderRadius: this.borderRadius,
          barPercentage: this.barOptions.barPercentage,
          maxBarThickness: this.barOptions.maxBarThickness,
          borderSkipped: this.barOptions.borderSkipped,
          borderWidth: this.barOptions.borderWidth,
        },
      ],
    };

    const options: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: this.interaction,
      layout: {
        padding: {
          right: 40, // 右側間距
        },
      },
      plugins: {
        legend: {
          display: true, // 不顯示標籤圖示
          align: 'start',
          onClick: null,
          labels: {
            usePointStyle: true,
          },
        },
        /** 游標提示元素的詳細信息 */
        tooltip: {
          usePointStyle: true,
          callbacks: {
            label: (context) => {
              const value = context.raw;
              return `${value}k${this.translate.instant('universal_unit_calories')}`; // 在 tooltip 中添加千單位
            },
          },
        },
        //圖表縮放
        zoom: this.zoom,
      },
      scales: {
        y: {
          beginAtZero: true, // y轴从0开始
          ticks: {
            callback: (value: number) => `${value}K`, // 刻度百分比符號
            // stepSize: 2.5, // 刻度的间隔
          },
          grid: {
            color: 'rgba(255,215,215,1)',
          },
          border: {
            dash: [10, 7],
          },
        },

        x: {
          // backgroundColor: ,
          // border:{
          //   dash:[2],
          // },
          grid: {
            drawOnChartArea: false, // only want the grid lines for one axis to show up
          },
          ticks: {
            maxTicksLimit: 5, // 指定要顯示的最大標籤數量
          },
        },
      },
    };

    const oldChart = Chart.getChart('calories');
    if (oldChart) {
      oldChart.destroy();
    }

    // 繪製新的圖表
    new Chart('calories', {
      type: 'bar',
      data: data,
      options: options, // 指定 options 物件來設定多個 Y 軸
    });
  }

  /**
   * 平均日數/時長圖
   */
  sportDayTime() {
    let xAxisData: string[];
    let yAxisData_day: number[];
    let yAxisData_time: number[];

    if (this.uiFlag.isMonthUnit) {
      // 根據月的資料更新 x 軸和 y 軸資料
      xAxisData = this.month_group.year_month;
      yAxisData_day = this.month_group.avg_sport_day;
      yAxisData_time = this.month_group.avg_sport_time;
    } else {
      // 根據周的資料更新 x 軸和 y 軸資料
      xAxisData = this.week_group.year_week_num;
      yAxisData_day = this.week_group.avg_sport_day;
      yAxisData_time = this.week_group.avg_sport_time;
    }

    const data: ChartData = {
      labels: xAxisData,
      datasets: [
        {
          label: `${this.translate.instant('universal_time_avgDays')}`,
          pointStyle: 'rect',
          type: 'bar',
          data: yAxisData_day,
          yAxisID: 'yday', // 指定要使用的 y 軸
          borderColor: 'rgba(192, 163, 255, 1)',
          backgroundColor: 'rgba(180, 131, 230, 1)',

          borderRadius: this.borderRadius,
          barPercentage: this.barOptions.barPercentage,
          maxBarThickness: this.barOptions.maxBarThickness,
          borderSkipped: this.barOptions.borderSkipped,
          borderWidth: this.barOptions.borderWidth,
          order: 2,
        },
        {
          label: `${this.translate.instant('universal_time_avgTimes')} (${this.translate.instant(
            'universal_time_minute'
          )})`,
          pointStyle: 'line',
          type: 'line',
          data: yAxisData_time,
          yAxisID: 'ytime', // 指定要使用的 y 軸
          borderColor: 'rgba(87, 144, 255, 1)',
          borderWidth: 2,
          tension: 0,
          order: 1, //讓它在長條圖上方顯示
        },
      ],
    };

    const options: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: this.interaction,
      layout: {
        padding: {
          left: 16, // 左側間距
          right: 20, // 右側間距
        },
      },
      plugins: {
        //圖表縮放
        zoom: this.zoom,
        legend: {
          display: true, // 不顯示標籤圖示
          align: 'start',
          onClick: null,
          labels: {
            usePointStyle: true,
          },
        },
        /** 游標提示元素的詳細信息 */
        tooltip: {
          usePointStyle: true,
          callbacks: {
            label: (context) => {
              const value = context.raw;
              const datasetIndex = context.datasetIndex;
              // 根據 datasetIndex 判斷要使用哪個單位
              if (datasetIndex === 0) {
                // 第一個資料集的 tooltip，平均運動天數
                return `${this.translate.instant(
                  'universal_adjective_avg'
                )}${this.translate.instant('universal_time_day')}:${value}${this.translate.instant(
                  'universal_time_day'
                )}`;
              } else if (datasetIndex === 1) {
                // 第二個資料集的 tooltip，平均運動時間
                return `${this.translate.instant(
                  'universal_adjective_avg'
                )}${this.translate.instant(
                  'universal_activityData_time'
                )}:${value}${this.translate.instant('universal_time_minute')}`;
              }
            },
          },
        },
      },
      scales: {
        yday: {
          type: 'linear', // linear 尺度表示數值型資料
          display: true, // 顯示這個尺度
          position: 'right', // 將day尺度放在右側
          grid: {
            drawOnChartArea: false, // only want the grid lines for one axis to show up
          },
          beginAtZero: true, // y轴从0开始
          // offset: true, // 啟用 offset
          // offsetAmount: 50, // 調整 offset 的距離（像素）
          ticks: {
            callback: (value: number) => value,
            stepSize: 1, // 刻度的间隔
          },
        },
        ytime: {
          type: 'linear', // linear 尺度表示數值型資料
          display: true, // 顯示這個尺度
          position: 'left', // 將time尺度放在左側
          // grid: {
          //   drawOnChartArea: false, // only want the grid lines for one axis to show up
          // },
          grid: {
            color: 'rgba(255,215,215,1)',
          },
          border: {
            dash: [10, 7],
          },
          beginAtZero: true, // y轴从0开始
          ticks: {
            callback: (value: number) => value,
            // stepSize: 20, // 刻度的间隔
            // color:'rgba(87, 144, 255, 1)'
          },
        },

        x: {
          grid: {
            drawOnChartArea: false, // only want the grid lines for one axis to show up
          },
          ticks: {
            // display: false,
            maxTicksLimit: 5, // 指定要顯示的最大標籤數量
          },
        },
      },
    };

    const oldChart = Chart.getChart('sport_day_time');
    if (oldChart) {
      oldChart.destroy();
    }

    // 繪製新的圖表
    new Chart('sport_day_time', {
      type: 'bar',
      data: data,
      options: options, // 指定 options 物件來設定多個 Y 軸
    });
  }

  ngOnDestroy(): void {
    // 取消訂閱語言更換事件
    if (this.languageChangeSubscription) {
      this.languageChangeSubscription.unsubscribe();
    }
    if (this.exerciseHabitsSubscription) {
      this.exerciseHabitsSubscription.unsubscribe();
    }
  }
}
