import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  ViewChild,
  ElementRef,
  Input,
  Renderer2,
  Output,
  EventEmitter,
  SimpleChanges,
} from '@angular/core';
import { chart, charts } from 'highcharts';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DataTypeUnitPipe } from '../../../pipes/data-type-unit.pipe';
import { mi } from '../../../models/bs-constant';
import { Unit } from '../../../enum/value-conversion';
import { countDistance } from '../../../utils/index';

/**
 * 建立圖表用
 */
class ChartOptions {
  constructor(dataset) {
    return {
      chart: {
        zoomType: 'xy', // 縮放的基準軸
        height: 180,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
      },
      title: {
        text: '',
      },
      credits: {
        enabled: false, // 是否顯示'Highchart'字樣
      },
      legend: {
        verticalAlign: 'top', // 數據類別顯示的相對位置
      },
      xAxis: {
        type: 'Linear',
      },
      yAxis: [
        {
          title: {
            text: '',
          },
          labels: {
            enabled: true, // 是否顯示軸線
          },
          gridLineColor: 'transparent', // 格線顏色
        },
        {
          title: {
            text: '',
          },
          labels: {
            enabled: true,
          },
          gridLineColor: 'transparent',
          opposite: true, // 軸線是否放置於另一邊
        },
      ],
      plotOptions: {
        series: {
          connectNulls: true, // 若為null值，是否要忽略null值將線連接起來
          marker: {
            enabled: false,
          },
        },
      },
      tooltip: {
        shared: true, // 是否共用一個tooltip
        animation: false,
        shadow: false,
        dateTimeLabelFormats: {
          millisecond: '%H:%M:%S',
          second: '%H:%M:%S',
          minute: '%H:%M:%S',
          hour: '%H:%M:%S',
          day: '%H:%M:%S',
          month: '%H:%M:%S',
          year: '%H:%M:%S',
        },
        valueDecimals: 1,
      },
      series: dataset,
    };
  }
}

@Component({
  selector: 'app-equidistant-chart',
  templateUrl: './equidistant-chart.component.html',
  styleUrls: ['./equidistant-chart.component.scss', '../chart-share-style.scss'],
})
export class EquidistantChartComponent implements OnInit, OnChanges, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Input() racerChange: number | null;
  @Input() removeAllRacer = true;
  @Input() unit: Unit;
  @Input() loadedList: any;
  @Input() altitude: number[];
  @Input() gpx: Array<Array<number>>;
  @Input() mapDistance: number;
  @Input() page: 'group' | 'person' = 'person';
  @Input() isPreviewMode = false;
  @ViewChild('container') container: ElementRef;

  chartIndex = null; // 此圖表在詳細頁面所有的highchart的順位
  terrain: Array<Array<number>>;

  constructor(
    private renderer: Renderer2,
    private translate: TranslateService,
    private dataTypeUnitPipe: DataTypeUnitPipe
  ) {}

  ngOnInit(): void {}

  ngOnChanges(e: SimpleChanges): void {
    const { gpx, racerChange, removeAllRacer } = e;
    if (gpx || racerChange || (removeAllRacer && removeAllRacer.currentValue)) {
      if (e.gpx) this.terrain = this.createAltitudeDistance();
      this.initChart(this.loadedList, this.terrain);
    }
  }

  /**
   * 根據gpx建立距離和海拔關聯的數據
   * @author kidin-1100324
   */
  createAltitudeDistance() {
    let terrain = [[0, this.altitude[0]]],
      totalDis = 0;
    for (let i = 0, len = this.gpx.length; i < len; i++) {
      const gpxA = this.gpx[i],
        gpxB = this.gpx[i + 1];
      if (i !== this.gpx.length - 1) {
        const nextDis = countDistance(gpxA, gpxB);
        // 去除相同位置的gpx資訊
        if (nextDis) {
          totalDis += nextDis;
          terrain.push([totalDis, this.altitude[i + 1]]);
        }
      }
    }

    // 針對進行等比縮放以符合該地圖宣告長度
    const totalDistance = terrain[terrain.length - 1][0];
    terrain = terrain.map((_terrain) => [
      +((_terrain[0] * this.mapDistance) / totalDistance).toFixed(0),
      _terrain[1],
    ]);
    return terrain;
  }

  /**
   * 將圖表初始化並處理數據
   * @param data {any}-資料
   * @param terrain {Array<Array<number>>}-時間
   * @author kidin-1100120
   */
  initChart(data: any, terrain: Array<Array<number>>) {
    this.translate
      .get('hellow world')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        const dataSet = [];
        data.forEach((_value) => {
          const { name, distanceBase, color } = _value;
          dataSet.push({
            name,
            yAxis: 0,
            data: distanceBase,
            showInLegend: true, // 是否顯示數據類別
            color,
            type: 'spline',
            tooltip: {
              valueSuffix: ' ' + this.dataTypeUnitPipe.transform('pace', [1, this.unit]),
            },
          });
        });

        if (terrain.length >= 0) {
          dataSet.push({
            name: this.translate.instant('universal_activityData_altitude'),
            yAxis: 1,
            data: terrain,
            showInLegend: true,
            color: '#00000033',
            type: 'area',
            tooltip: {
              valueSuffix: ' ' + (this.unit === 0 ? 'm' : 'ft'),
            },
          });
        }

        const chartOptions = new ChartOptions(dataSet);
        chartOptions['yAxis'][0].reversed = true; // y軸反轉

        // 將y軸修改為符合配速的格式
        chartOptions['yAxis'][0].labels = {
          formatter: function () {
            const val = +this.value,
              costminperkm = Math.floor(val / 60),
              costsecondperkm = Math.round(val - costminperkm * 60),
              timeMin = ('0' + costminperkm).slice(-2),
              timeSecond = ('0' + costsecondperkm).slice(-2);
            return `${timeMin}'${timeSecond}"`;
          },
        };

        // 將tooltip內的資料修改為符合配速的格式
        for (let i = 0, len = chartOptions['series'].length; i < len - 1; i++) {
          chartOptions['series'][i].tooltip = {
            pointFormatter: function () {
              const val = this.y,
                costminperkm = Math.floor(val / 60),
                costsecondperkm = Math.round(val - costminperkm * 60),
                timeMin = ('0' + costminperkm).slice(-2),
                timeSecond = ('0' + costsecondperkm).slice(-2),
                paceVal = `${timeMin}'${timeSecond}"`;
              return `<br><span style="color: ${this.series.color};">●</span> ${this.series.name}: <b>${paceVal}</b><br>`;
            },
          };
        }

        chartOptions['yAxis'][0].min = 0;
        chartOptions['yAxis'][0].max = 1800;
        this.createChart(chartOptions);
      });
  }

  /**
   * 確認取得元素才建立圖表
   * @param option
   * @author kidin-1100120
   */
  createChart(option: ChartOptions) {
    setTimeout(() => {
      const chartDiv = this.container.nativeElement;
      if (!this.container) {
        this.createChart(option);
      } else {
        this.chartIndex = chart(chartDiv, option).index; // 產生圖表同時紀錄此圖表的index
      }
    }, 200);
  }

  /**
   * 將數據依資料類別及公英制進行轉換
   * @param data {number}
   * @param type {string}
   * @author kidin-1100121
   */
  convertData(data: number, type: string): number | string {
    const costSecond = +(3600 / (this.unit === 0 ? data : data / mi)).toFixed(0); // 公里或英里配速
    return costSecond > 3600 ? 3600 : costSecond;
  }

  /**
   * 取消訂閱rxjs
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
