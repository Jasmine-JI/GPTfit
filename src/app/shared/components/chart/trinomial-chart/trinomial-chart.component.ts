import { Component, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, Input, Renderer2, Output, EventEmitter } from '@angular/core';
import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DataTypeUnitPipe } from '../../../pipes/data-type-unit.pipe';
import { TemperatureSibsPipe } from '../../../pipes/temperature-sibs.pipe';
import { mi, ft } from '../../../models/bs-constant';

const Highcharts: any = _Highcharts; // 不檢查highchart型態

/**
 * 建立圖表用
 */
class ChartOptions {
  constructor (dataset) {
    return {
      chart: {
        zoomType: 'x', // 縮放的基準軸
        height: 130,
        backgroundColor: 'rgba(255, 255, 255, 0.7)'
      },
      title: {
        text: ''
      },
      credits: {
        enabled: false // 是否顯示'Highchart'字樣
      },
      legend: {
        verticalAlign: 'top' // 數據類別顯示的相對位置
      },
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: {
          millisecond: '%H:%M:%S',
          second: '%H:%M:%S',
          minute: '%H:%M:%S',
          hour: '%H:%M:%S',
          day: '%H:%M:%S',
          month: '%H:%M:%S',
          year: '%H:%M:%S'
        }
      },
      yAxis: [
        {
          title: {
              text: ''
          },
          labels: {
            enabled: true,  // 是否顯示軸線
          },
          gridLineColor: 'transparent'  // 格線顏色
        },
        {
          title: {
              text: ''
          },
          labels: {
            enabled: true
          },
          gridLineColor: 'transparent',
          opposite: true  // 軸線是否放置於另一邊
        },
        {
          title: {
              text: ''
          },
          labels: {
            enabled: false
          },
          gridLineColor: 'transparent'
        }
      ],
      plotOptions: {
        series: {
          connectNulls: true,  // 若為null值，是否要忽略null值將線連接起來
          marker: {
            enabled: false
          }
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
          year: '%H:%M:%S'
        },
        valueDecimals: 1
      },
      series: dataset
    };
  }
}


@Component({
  selector: 'app-trinomial-chart',
  templateUrl: './trinomial-chart.component.html',
  styleUrls: ['./trinomial-chart.component.scss']
})
export class TrinomialChartComponent implements OnInit, OnChanges, OnDestroy {

  private ngUnsubscribe = new Subject;

  @Input('sportType') sportType: number;
  @Input('unit') unit: 0 | 1;
  @Input('compareA') compareA: any;
  @Input('compareB') compareB: any;
  @Input('terrain') terrain: number[];
  @Input('second') second: number[];
  @Input('showMap') showMap: boolean;
  @ViewChild('container') container: ElementRef;
  @Output() onHover: EventEmitter<any> = new EventEmitter();

  chartIndex = null; // 此圖表在詳細頁面所有的highchart的順位

  constructor(
    private renderer: Renderer2,
    private translate: TranslateService,
    private dataTypeUnitPipe: DataTypeUnitPipe,
    private temperatureSibsPipe: TemperatureSibsPipe
  ) {}

  ngOnInit(): void {}

  ngOnChanges(): void {
    this.initChart(this.compareA.data, this.compareB.data, this.terrain, this.second);
  }

  /**
   * 將圖表初始化並處理數據
   * @param dataA {}-資料一
   * @param dataB {}-資料二
   * @param second {}-時間
   * @author kidin-1100120
   */
  initChart(dataA: Array<number>, dataB: Array<number>, terrain: Array<number>, second: Array<number>) {
    this.translate.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      let dataSet: any;
      const chartDataA = [],
            chartDataB = [],
            chartTerrain = [];
      for (let i = 0, dataLen = second.length; i < dataLen; i++) {
        // highchart時間以毫秒為單位
        chartDataA.push([second[i] * 1000, this.convertData(+dataA[i], this.compareA.type)]);
        chartDataB.push([second[i] * 1000, this.convertData(+dataB[i], this.compareB.type)]);
        if (terrain.length >= 0) {
          chartTerrain.push([second[i] * 1000, this.convertData(+terrain[i], 'altitude')]);
        }

      }

      dataSet = [
        {
          name: this.compareA.name,
          yAxis: 0,
          data: chartDataA,
          showInLegend: true,  // 是否顯示數據類別
          color: this.compareA.color,
          type: 'spline',
          tooltip: {
            valueSuffix: ' ' + this.dataTypeUnitPipe.transform(this.compareA.type, [this.sportType, this.unit])
          }
        },
        {
          name: this.compareB.name,
          yAxis: 1,
          data: chartDataB,
          showInLegend: true,
          color: this.compareB.color,
          type: 'spline',
          tooltip: {
            valueSuffix: ' ' + this.dataTypeUnitPipe.transform(this.compareB.type, [this.sportType, this.unit])
          }
        }
      ]

      if (terrain.length >= 0) {
        dataSet.push({
          name: this.translate.instant('universal_activityData_altitude'),
          yAxis: 2,
          data: chartTerrain,
          showInLegend: true,
          color: '#00000033',
          type: 'area',
          tooltip: {
            valueSuffix: ' ' + (this.unit === 0 ? 'm' : 'ft')
          }
        });
      }

      const chartOptions = new ChartOptions(dataSet);
      if ([this.compareA.type, this.compareB.type].includes('pace')) {
        const index = this.compareA.type === 'pace' ? 0 : 1;
        chartOptions['yAxis'][index].reversed = true;  // y軸反轉

        // 將y軸修改為符合配速的格式
        chartOptions['yAxis'][index].labels = {
          formatter: function() {
            const val = +this.value,
                  costminperkm = Math.floor(val / 60),
                  costsecondperkm = Math.round(val - costminperkm * 60),
                  timeMin = ('0' + costminperkm).slice(-2),
                  timeSecond = ('0' + costsecondperkm).slice(-2);
            return `${timeMin}'${timeSecond}"`;
          }
        };

        // 將tooltip內的資料修改為符合配速的格式
        chartOptions['series'][index].tooltip = {
          pointFormatter: function() {
            const val = this.y,
                  costminperkm = Math.floor(val / 60),
                  costsecondperkm = Math.round(val - costminperkm * 60),
                  timeMin = ('0' + costminperkm).slice(-2),
                  timeSecond = ('0' + costsecondperkm).slice(-2),
                  paceVal = `${timeMin}'${timeSecond}"`;
            return `<br><span style="color: ${this.series.color};">●</span> ${this.series.name}: <b>${paceVal}</b><br>`;
          }
        }

        chartOptions['yAxis'][index].min = 0;
        chartOptions['yAxis'][index].max = 3600;
      }

      this.createChart(chartOptions);
    });

  }

  /**
   * 確認取得元素才建立圖表
   * @param option 
   * @author kidin-1100120
   */
  createChart (option: ChartOptions) {

    setTimeout (() => {
      const chartDiv = this.container.nativeElement;
      if (!this.container) {
        this.createChart(option);
      } else {
        this.chartIndex = chart(chartDiv, option).index;  // 產生圖表同時紀錄此圖表的index
      }

      if (this.showMap) {
        this.renderer.listen(chartDiv, 'mousemove', e => this.handleSynchronizedPoint(e));
        this.renderer.listen(chartDiv, 'touchmove', e => this.handleSynchronizedPoint(e));
        this.renderer.listen(chartDiv, 'touchstart', e => this.handleSynchronizedPoint(e));
      }

    }, 200);

  }

  /**
   * 滑動Hchart時，使地圖的點跟著移動
   * @param e {any}
   * @author kidin-1100122
   */
  handleSynchronizedPoint(e: any) {
    const compareChart: any = Highcharts.charts[this.chartIndex],
          event = compareChart.pointer.normalize(e), // Find coordinates within the chart
          point = compareChart.series[0].searchPoint(event, true); // Get the hovered point
    if (point && point.index) {
      this.onHover.emit(point.index);
    }

  }


  /**
   * 將數據依資料類別及公英制進行轉換
   * @param data {number}
   * @param type {string}
   * @author kidin-1100121
   */
  convertData(data: number, type: string): number | string {
    switch (type) {
      case 'speed':
        return this.unit === 0 ? data : data / mi;
      case 'pace':
        let costSecond: number;
        switch (this.sportType) {
          case 1:
            costSecond = +(3600 / (this.unit === 0 ? data : data / mi)).toFixed(0); // 公里或英里配速
            break;
          case 4:
            costSecond = +(3600 / (data * 10)).toFixed(0);  // 百米配速
            break;
          case 6:
            costSecond = +(3600 / (data * 2)).toFixed(0);  // 500米配速
            break;
        }

        return costSecond > 3600 ? 3600 : costSecond;
      case 'temperature':
        return this.temperatureSibsPipe.transform(data, [this.unit, 1]);
      case 'altitude':
        return this.unit === 0 ? data : +(data / ft).toFixed(1);
      default:
        return data;
    }

  }

  /**
   * 取消訂閱rxjs
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
