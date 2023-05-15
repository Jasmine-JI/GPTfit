import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  ViewChild,
  ElementRef,
  Input,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { chart } from 'highcharts';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { zoneColor } from '../../../models/chart-data';
import { GlobalEventsService } from '../../../../core/services';

/**
 * 建立圖表用
 * @constructs dataset {any}
 * @author kidin-1081212
 */
class ChartOptions {
  constructor(dataset: any) {
    return {
      chart: {
        height: 300,
        backgroundColor: 'transparent',
      },
      title: {
        text: '',
      },
      credits: {
        enabled: false,
      },
      xAxis: {
        categories: [],
        title: {
          enabled: false,
        },
      },
      yAxis: {
        labels: '',
        title: {
          enabled: false,
        },
      },
      plotOptions: {
        column: {
          pointPlacement: 0,
        },
        series: {
          pointPadding: 0,
          groupPadding: 0,
          borderColor: 'rgba(48, 48, 48, 1)',
        },
      },
      tooltip: {
        pointFormat: '{point.y}%',
        valueDecimals: 1,
      },
      series: [
        {
          type: 'column',
          data: dataset,
          showInLegend: false,
        },
      ],
    };
  }
}

@Component({
  selector: 'app-hrzone-chart',
  templateUrl: './hrzone-chart.component.html',
  styleUrls: ['./hrzone-chart.component.scss', '../chart-share-style.scss'],
})
export class HrzoneChartComponent implements OnInit, OnChanges, OnDestroy {
  private ngUnsubscribe = new Subject();

  noHRZoneData = true;
  highestHRZone = '';
  highestHRZoneValue = 0;
  highestHRZoneColor = '';

  @Input() data: Array<number>; // 各心率區間總秒數，ex.[992, 123, 1534, 1234, 1231, 321]
  @Input() type: 'mixHrZone' | 'personalAnalysis';
  @Input() isPreviewMode = false;
  @ViewChild('container', { static: false })
  container: ElementRef;

  constructor(
    private translateService: TranslateService,
    private globalEventsService: GlobalEventsService
  ) {}

  ngOnInit(): void {
    this.subscribeGlobalEvents();
  }

  ngOnChanges() {
    this.handleChart();
  }

  /**
   * 處理繪製圖表流程
   */
  handleChart() {
    this.noHRZoneData = this.data.reduce((accumulator, current) => accumulator + current) === 0;
    this.initInfoHighChart();
  }

  /**
   * 訂閱全域自定義事件
   */
  subscribeGlobalEvents() {
    this.globalEventsService
      .getRxSideBarMode()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.handleChart();
      });
  }

  /**
   * 初始化highChart
   * @author kidin-1081211
   */
  initInfoHighChart() {
    this.translateService
      .get('hellow world')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        const zoneZero = `${this.translateService.instant(
            'universal_activityData_limit_generalZone'
          )}`,
          zoneOne = `${this.translateService.instant('universal_activityData_warmUpZone')}`,
          zoneTwo = `${this.translateService.instant('universal_activityData_aerobicZone')}`,
          zoneThree = `${this.translateService.instant('universal_activityData_enduranceZone')}`,
          zoneFour = `${this.translateService.instant('universal_activityData_marathonZone')}`,
          zoneFive = `${this.translateService.instant('universal_activityData_anaerobicZone')}`;

        this.highestHRZoneValue = 0;

        const totalSecond = this.data.reduce((accumulator, current) => accumulator + current),
          zoneZeroPercentage = (this.data[0] / totalSecond) * 100,
          zoneOnePercentage = (this.data[1] / totalSecond) * 100,
          zoneTwoPercentage = (this.data[2] / totalSecond) * 100,
          zoneThreePercentage = (this.data[3] / totalSecond) * 100,
          zoneFourPercentage = (this.data[4] / totalSecond) * 100,
          zoneFivePercentage = (this.data[5] / totalSecond) * 100;

        const sportPercentageDataset = [
          { y: zoneZeroPercentage, color: zoneColor[0] },
          { y: zoneOnePercentage, color: zoneColor[1] },
          { y: zoneTwoPercentage, color: zoneColor[2] },
          { y: zoneThreePercentage, color: zoneColor[3] },
          { y: zoneFourPercentage, color: zoneColor[4] },
          { y: zoneFivePercentage, color: zoneColor[5] },
        ];

        if (this.type !== 'personalAnalysis') {
          // 取得最高占比的心率區間-kidin-1090130
          let highestHRZoneIndex = 0;
          for (let i = 0; i < 6; i++) {
            if (sportPercentageDataset[i].y > this.highestHRZoneValue) {
              this.highestHRZoneValue = sportPercentageDataset[i].y;
              highestHRZoneIndex = i;
            }
          }

          switch (highestHRZoneIndex) {
            case 0:
              this.highestHRZone = zoneZero;
              this.highestHRZoneColor = zoneColor[0];
              break;
            case 1:
              this.highestHRZone = zoneOne;
              this.highestHRZoneColor = zoneColor[1];
              break;
            case 2:
              this.highestHRZone = zoneTwo;
              this.highestHRZoneColor = zoneColor[2];
              break;
            case 3:
              this.highestHRZone = zoneThree;
              this.highestHRZoneColor = zoneColor[3];
              break;
            case 4:
              this.highestHRZone = zoneFour;
              this.highestHRZoneColor = zoneColor[4];
              break;
            case 5:
              this.highestHRZone = zoneFive;
              this.highestHRZoneColor = zoneColor[5];
              break;
          }

          const HRChartOptions = new ChartOptions(sportPercentageDataset);

          HRChartOptions['series'][0].dataLabels = {
            enabled: true,
            formatter: function () {
              return this.y.toFixed(1) + '%';
            },
          };

          HRChartOptions['xAxis'].categories = [
            zoneZero,
            zoneOne,
            zoneTwo,
            zoneThree,
            zoneFour,
            zoneFive,
          ];

          HRChartOptions['yAxis'].labels = {
            formatter: function () {
              return this.value + '%';
            },
          };

          // 處理列印時highchart無法自適應造成跑版的問題-kidin-1090211
          if (location.search.indexOf('ipm=s') > -1) {
            HRChartOptions['chart'].width = 420;
          }

          this.createChart(HRChartOptions);
        } else {
          const HRChartOptions = new ChartOptions(sportPercentageDataset);
          HRChartOptions['chart'] = {
            margin: [2, 0, 2, 0],
            height: 40,
            width: 180,
            style: {
              overflow: 'visible',
            },
            backgroundColor: 'transparent',
          };

          HRChartOptions['xAxis'] = {
            labels: {
              enabled: false,
            },
            title: {
              text: null,
            },
            startOnTick: false,
            endOnTick: false,
            tickPositions: [],
          };

          HRChartOptions['yAxis'] = {
            endOnTick: false,
            startOnTick: false,
            labels: {
              enabled: false,
            },
            title: {
              text: null,
            },
            tickPositions: [0],
          };

          HRChartOptions['tooltip'] = {
            hideDelay: 0,
            outside: true,
            headerFormat: null,
            pointFormat: '{point.y}%',
            valueDecimals: 1,
          };

          HRChartOptions['plotOptions'].column['pointPlacement'] = 0;
          HRChartOptions['legend'] = {
            enabled: false,
          };

          HRChartOptions['chart'].zoomType = '';
          this.createChart(HRChartOptions);
        }
      });
  }

  /**
   * 確認取得元素才建立圖表
   * @param option {ChartOptions}
   * @author kidin-1090706
   */
  createChart(option: ChartOptions) {
    setTimeout(() => {
      if (!this.container) {
        this.createChart(option);
      } else {
        const chartDiv = this.container.nativeElement;
        chart(chartDiv, option);
      }
    }, 200);
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
