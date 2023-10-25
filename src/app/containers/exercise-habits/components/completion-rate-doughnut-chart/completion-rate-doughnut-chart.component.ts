import { AsyncPipe, NgIf } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Chart, ChartOptions } from 'chart.js/auto';
import { Subject, Subscription, takeUntil } from 'rxjs';
import {
  Api531Response,
  ExerciseHabitsService,
  latest_two_month_response,
  latest_two_weeks_days,
} from '../../service/exercise-habits.service';

@Component({
  selector: 'app-completion-rate-doughnut-chart',
  templateUrl: './completion-rate-doughnut-chart.component.html',
  styleUrls: ['./completion-rate-doughnut-chart.component.scss'],
  standalone: true,
  imports: [TranslateModule, NgIf, AsyncPipe],
})
export class CompletionRateDoughnutChartComponent implements OnInit, AfterViewInit, OnDestroy {
  private languageChangeSubscription: Subscription;
  private ngUnsubscribe = new Subject();
  @ViewChild('week_month_chart') weekMonthChart: ElementRef;

  // post Response
  api531Response: Api531Response;
  latest_two_month_response: latest_two_month_response[];
  latest_two_weeks_days: latest_two_weeks_days[];
  thisMonthCompletionRate: string;
  lastMonthCompletionRate: string;
  thisWeekCompletionRate: string;
  lastWeekCompletionRate: string;
  ifNoData: boolean;

  //上週/月設定之顏色
  lastWeekMonthColors = [
    'rgba(178, 202, 255, 1)',
    'rgba(178, 232, 255, 1)',
    'rgba(193, 255, 178, 1)',
    'rgba(255, 254, 178, 1)',
    'rgba(255, 227, 178, 1)',
    'rgba(243, 190, 241, 1)',
    'rgba(255, 178, 178, 1)',
  ];

  //本週/月設定之顏色
  thisWeekMonthColors = [
    'rgba(127, 166, 255, 1)',
    'rgba(127, 217, 255, 1)',
    'rgba(151, 255, 128, 1)',
    'rgba(255, 253, 122, 1)',
    'rgba(255, 206, 120, 1)',
    'rgba(231, 126, 227, 1)',
    'rgba(255, 128, 128, 1)',
  ];

  ngOnInit() {
    this.get531Response();
  }

  ngAfterViewInit() {
    this.languageChangeSubscription = this.translate.onLangChange
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        if (this.api531Response) {
          this.initChart();
        }
      });

    // 監聽 week_month_chart 寬度變化事件，並直接執行圖表 resize() 方法
    new ResizeObserver(() => {
      const weeksChart = Chart.getChart('weeks');
      if (weeksChart) {
        weeksChart.resize();
      }
      const monthsChart = Chart.getChart('months');
      if (monthsChart) {
        monthsChart.resize();
      }
    }).observe(this.weekMonthChart.nativeElement);
  }

  constructor(
    private exerciseHabitsService: ExerciseHabitsService,
    private translate: TranslateService
  ) {}

  /**
   * 取回已儲存的 531API response
   */
  get531Response() {
    this.exerciseHabitsService
      .getIfNoDataObservable()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((value) => {
        this.ifNoData = value;
      });
    if (this.ifNoData === false) {
      //有運動資料
      this.exerciseHabitsService
        .get531Response()
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe((response: Api531Response) => {
          this.api531Response = response;
          this.getData(response);
        });
    }
  }

  /**
   * 取得頁面所需資料
   * @param response
   */
  getData(response: Api531Response) {
    if (this.api531Response) {
      this.latest_two_month_response = response.latest_two_month_response;
      this.latest_two_weeks_days = response.latest_two_weeks_days;
      setTimeout(() => {
        this.initChart();
      }, 500);
    }
  }

  /**
   * 繪製圖表
   */
  initChart() {
    this.weeksValue();
    this.monthsValue();
  }

  /**
   * 上/本周完成率圖
   */
  weeksValue() {
    const twoWeeks = [...new Set(this.latest_two_weeks_days.map((item) => item.year_week_num))];
    //上周週數
    const lastWeek = twoWeeks[0];

    //本周週數
    const thisWeek = twoWeeks[1];

    // 篩選符合週數的達成率資料
    const getWeekValues = (weekNum: string) =>
      this.latest_two_weeks_days
        .filter((item) => item.year_week_num === weekNum)
        .map((item) => item.avg_effect_value * 100);

    const lastWeekValues = getWeekValues(lastWeek);
    const thisWeekValues = getWeekValues(thisWeek);

    // 取得對應的 day_of_week 屬性作為 labels
    const getWeekLabels = (weekNum: string) =>
      this.latest_two_weeks_days
        .filter((item) => item.year_week_num === weekNum)
        .map((item) => item.day_of_week);

    const lastWeekLabels = getWeekLabels(lastWeek);
    const thisWeekLabels = getWeekLabels(thisWeek);

    // 上周-每天指定顏色
    const getLastWeekColor = (dayOfWeek) => {
      if (dayOfWeek === 'empty') {
        return 'rgba(255,255,255,0)';
      } else {
        const dayIndexInWeek = lastWeekLabels.indexOf(dayOfWeek);
        if (dayIndexInWeek !== -1) {
          return this.lastWeekMonthColors[dayIndexInWeek % this.lastWeekMonthColors.length];
        }
      }
    };

    // 本周-每天指定顏色
    const getThisWeekColor = (dayOfWeek) => {
      if (dayOfWeek === 'empty') {
        return 'rgba(255,255,255,0)';
      } else {
        const dayIndexInWeek = thisWeekLabels.indexOf(dayOfWeek);
        if (dayIndexInWeek !== -1) {
          return this.thisWeekMonthColors[dayIndexInWeek % this.thisWeekMonthColors.length];
        }
      }
    };

    const data = {
      labels: lastWeekLabels.concat(thisWeekLabels), // 合併兩週的日期
      datasets: [
        {
          data: [...lastWeekValues, ...new Array(thisWeekLabels.length).fill(null)], // 使用 null 填充未知的本週值
          backgroundColor: [
            ...lastWeekLabels.map((dayOfWeek) => getLastWeekColor(dayOfWeek)),
            ...new Array(thisWeekLabels.length).fill(null),
          ],
          hoverBackgroundColor: [
            ...lastWeekLabels.map((dayOfWeek) => {
              if (dayOfWeek === 'empty') {
                return 'rgba(255,255,255,0)'; // 'empty'設置透明的颜色
              }
            }),
            ...new Array(thisWeekLabels.length).fill(null),
          ],
          hoverBorderColor: [
            ...lastWeekLabels.map((dayOfWeek) => {
              if (dayOfWeek === 'empty') {
                return '#e2eeee'; // 'empty'設置透明的颜色
              }
            }),
            ...new Array(thisWeekLabels.length).fill(null),
          ],
          borderColor: '#e2eeee',
          borderRadius: 10,
          weight: 0.4,
        },
        {
          data: [...new Array(lastWeekLabels.length).fill(null), ...thisWeekValues], // 使用 null 填充未知的上週值
          backgroundColor: [
            ...new Array(lastWeekLabels.length).fill(null),
            ...thisWeekLabels.map((dayOfWeek) => getThisWeekColor(dayOfWeek)),
          ],
          hoverBackgroundColor: [
            ...new Array(lastWeekLabels.length).fill(null),
            ...thisWeekLabels.map((dayOfWeek) => {
              if (dayOfWeek === 'empty') {
                return 'rgba(255,255,255,0)'; // 'empty'設置透明的颜色
              }
            }),
          ],
          hoverBorderColor: [
            ...new Array(lastWeekLabels.length).fill(null),
            ...thisWeekLabels.map((dayOfWeek) => {
              if (dayOfWeek === 'empty') {
                return '#e2eeee'; // 'empty'設置透明的颜色
              }
            }),
          ],
          borderColor: '#e2eeee',
          borderRadius: 5,
          cutout: '50%',
        },
      ],
    };

    const options: ChartOptions = {
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        easing: 'easeOutBounce',
      },
      plugins: {
        legend: {
          display: false, // 不顯示標籤圖示
        },
        tooltip: {
          filter: (tooltipItem) => tooltipItem.label !== 'empty',
          callbacks: {
            label: (context) => {
              const value = context.dataset.data[context.dataIndex] as number;
              const weekNumber = context.chart.data.labels[context.dataIndex];
              if (weekNumber === 'empty') {
                return null; // 如果 weekNumber 為 'empty'，返回空字符串，不顯示 tooltip
              } else {
                return value.toFixed(0) + '%';
              }
            },
          },
        },
      },
    };

    // 過濾出符合條件的資料
    const thisWeekIndex = this.api531Response.week_group['year_week_num'].indexOf(thisWeek);
    const lastWeekIndex = this.api531Response.week_group['year_week_num'].indexOf(lastWeek);

    // 本周完成率
    this.thisWeekCompletionRate = (
      this.api531Response.week_group['effect_value'][thisWeekIndex] * 100
    ).toFixed(0);
    this.lastWeekCompletionRate = (
      this.api531Response.week_group['effect_value'][lastWeekIndex] * 100
    ).toFixed(0);

    const oldChart = Chart.getChart('weeks');
    if (oldChart) {
      oldChart.destroy();
    }

    // 繪製新的圖表
    new Chart('weeks', {
      type: 'doughnut',
      data: data,
      options: options, // 指定 options 物件來設定多個 Y 軸
    });
  }

  monthsValue() {
    const twoMonths = [...new Set(this.latest_two_month_response.map((item) => item.year_month))];

    //上月週數
    const lastMonth = twoMonths[0];

    //本月週數
    const thisMonth = twoMonths[1];

    // 篩選符合週數的達成率資料
    const getMonthValues = (MonthNum: string) =>
      this.latest_two_month_response
        .filter((item) => item.year_month === MonthNum)
        .map((item) => item.effect_value * 100);

    const lastMonthValues = getMonthValues(lastMonth);
    const thisMonthValues = getMonthValues(thisMonth);

    // 取得對應的 year_week_num 屬性作為 labels
    const getMonthLabels = (MonthNum: string) => [
      ...new Set(
        this.latest_two_month_response
          .filter((item) => item.year_month === MonthNum)
          .map((item) => item.year_week_num)
      ),
    ];

    const lastMonthLabels = getMonthLabels(lastMonth);
    const thisMonthLabels = getMonthLabels(thisMonth);

    // 上月-每周指定顏色
    const getLastMonthColor = (weekNumber) => {
      if (weekNumber === 'empty') {
        return 'rgba(255,255,255,0)';
      } else {
        const weekIndexInMonth = lastMonthLabels.indexOf(weekNumber); // 取得週數在本月的索引
        if (weekIndexInMonth !== -1) {
          return this.lastWeekMonthColors[weekIndexInMonth % this.lastWeekMonthColors.length];
        }
      }
    };

    // 本月-每周指定顏色
    const getThisMonthColor = (weekNumber: any) => {
      if (weekNumber === 'empty') {
        return 'rgba(255,255,255,0)';
      } else {
        // 找到週數在 weeksOfThisMonth 数组中的索引
        const weekIndexInArray = thisMonthLabels.indexOf(weekNumber);
        if (weekIndexInArray !== -1) {
          // 使用 weekIndexInArray 来索引颜色数组
          return this.thisWeekMonthColors[weekIndexInArray % this.thisWeekMonthColors.length];
        }
      }
    };

    const data = {
      labels: [...lastMonthLabels, ...thisMonthLabels],
      datasets: [
        {
          data: [...lastMonthValues, ...new Array(thisMonthValues.length).fill(null)], // 使用 null 填充未知的本月值
          backgroundColor: [
            ...lastMonthLabels.map(
              (weekNumber) => getLastMonthColor(weekNumber),
              ...new Array(thisMonthValues.length).fill(null)
            ),
          ],
          hoverBackgroundColor: lastMonthLabels.map((weekNumber) => {
            if (weekNumber === 'empty') {
              return 'rgba(255,255,255,0)'; // 'empty'設置透明的颜色
            }
          }),
          hoverBorderColor: lastMonthLabels.map((weekNumber) => {
            if (weekNumber === 'empty') {
              return 'rgba(255,255,255,1)'; // 'empty'設置透明的颜色
            }
          }),
          weight: 0.4,
          borderRadius: 10,
        },
        {
          data: [...new Array(lastMonthValues.length).fill(null), ...thisMonthValues], // 使用 null 填充未知的上月值
          backgroundColor: [
            ...new Array(lastMonthValues.length).fill(null),
            ...thisMonthLabels.map((weekNumber) => getThisMonthColor(weekNumber)),
          ],
          hoverBackgroundColor: [
            ...new Array(lastMonthValues.length).fill(null),
            ...thisMonthLabels.map((weekNumber) => {
              if (weekNumber === 'empty') {
                return 'rgba(255,255,255,0)'; // 'empty'設置透明的颜色
              }
            }),
          ],
          hoverBorderColor: [
            ...new Array(lastMonthValues.length).fill(null),
            ...thisMonthLabels.map((weekNumber) => {
              if (weekNumber === 'empty') {
                return 'rgba(255,255,255,1)'; // 'empty'設置透明的颜色
              }
            }),
          ],
          cutout: '50%',
          borderRadius: 5,
        },
      ],
    };

    const options: ChartOptions = {
      responsive: true, // 允許圖表自適應大小
      maintainAspectRatio: true,
      animation: {
        easing: 'easeOutBounce',
      },
      plugins: {
        legend: {
          display: false, // 不顯示標籤圖示
        },
        tooltip: {
          filter: (tooltipItem) => tooltipItem.label !== 'empty',
          callbacks: {
            label: (context) => {
              const value = context.dataset.data[context.dataIndex] as number;
              const weekNumber = context.chart.data.labels[context.dataIndex];
              if (weekNumber === 'empty') {
                return null; // 如果 weekNumber 為 'empty'，返回空字符串，不顯示 tooltip
              } else {
                return value.toFixed(0) + '%';
              }
            },
          },
        },
      },
    };

    // 過濾出符合條件的資料
    const thisMonthIndex = this.api531Response.month_group['year_month'].indexOf(thisMonth);
    const lastMonthIndex = this.api531Response.month_group['year_month'].indexOf(lastMonth);

    // 本月完成率
    this.thisMonthCompletionRate = (
      this.api531Response.month_group['effect_value'][thisMonthIndex] * 100
    ).toFixed(0);
    this.lastMonthCompletionRate = (
      this.api531Response.month_group['effect_value'][lastMonthIndex] * 100
    ).toFixed(0);

    const oldChart = Chart.getChart('months');
    if (oldChart) {
      oldChart.destroy();
    }

    // 繪製新的圖表
    new Chart('months', {
      type: 'doughnut',
      data: data,
      options: options, // 指定 options 物件來設定多個 Y 軸
    });
  }

  ngOnDestroy(): void {
    // 取消訂閱語言更換事件
    if (this.languageChangeSubscription) {
      this.languageChangeSubscription.unsubscribe();
    }
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
