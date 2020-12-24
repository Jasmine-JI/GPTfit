import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, OnChanges } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';

const Highcharts: any = _Highcharts; // 不檢查highchart型態

// 建立圖表用-kidin-1081212
class ChartOptions {
  constructor (dataset) {
    return {
      chart: {
        height: 150,
        margin: [0, 0, 0, 0]
      },
      title: {
        text: ''
      },
      credits: {
        enabled: false
      },
      tooltip: {
        pointFormat: '{point.percentage:.1f}%'
      },
      plotOptions: {
        pie: {
            dataLabels: {
                distance: -10,
                formatter: function () {
                  return this.point.percentage.toFixed(0) + '%';
                },
                style: {
                    fontWeight: 'bold',
                    color: 'black'
                }
            },
            startAngle: -90,
            endAngle: -90,
            center: ['50%', '50%'],
            size: '95%'
        }
      },
      series: [{
        type: 'pie',
        innerSize: '70%',
        data: dataset
      }]
    };
  }
}

@Component({
  selector: 'app-ring-chart',
  templateUrl: './ring-chart.component.html',
  styleUrls: ['./ring-chart.component.scss']
})

export class RingChartComponent implements OnInit, OnChanges, OnDestroy {

  @Input() data: Array<number>;
  @Input() selectType: number;  // 先預埋根據運動類型過濾落點-kidin-1090131

  @ViewChild('container', {static: false})
  container: ElementRef;

  constructor(
    private translateService: TranslateService
  ) { }

  ngOnInit() { }

  ngOnChanges() {
    this.initInfoHighChart();
  }

  // 初始化highChart-kidin-1081211
  initInfoHighChart () {
    const sportPercentageDataset = [];
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i] !== 0) {
        switch (i) {
          case 0:
            if (this.selectType !== 1 && this.selectType !== 99) {
              sportPercentageDataset.push({
                name: this.translateService.instant('universal_activityData_run'), y: this.data[0], color: '#9e9e9e'
              });
            } else {
              sportPercentageDataset.push({
                name: this.translateService.instant('universal_activityData_run'), y: this.data[0], color: '#ea5757'
              });
            }
            break;
          case 1:
            if (this.selectType !== 2 && this.selectType !== 99) {
              sportPercentageDataset.push({
                name: this.translateService.instant('universal_activityData_cycle'), y: this.data[1], color: '#9e9e9e'
              });
            } else {
              sportPercentageDataset.push({
                name: this.translateService.instant('universal_activityData_cycle'), y: this.data[1], color: '#ff9a22'
              });
            }
          break;
          case 2:
            if (this.selectType !== 3 && this.selectType !== 99) {
              sportPercentageDataset.push({
                name: this.translateService.instant('universal_activityData_weightTraining'), y: this.data[2], color: '#9e9e9e'
              });
            } else {
              sportPercentageDataset.push({
                name: this.translateService.instant('universal_activityData_weightTraining'), y: this.data[2], color: '#f9cc3d'
              });
            }
          break;
          case 3:
            if (this.selectType !== 4 && this.selectType !== 99) {
              sportPercentageDataset.push({
                name: this.translateService.instant('universal_activityData_swin'), y: this.data[3], color: '#9e9e9e'
              });
            } else {
              sportPercentageDataset.push({
                name: this.translateService.instant('universal_activityData_swin'), y: this.data[3], color: '#cfef4b'
              });
            }
          break;
          case 4:
            if (this.selectType !== 5 && this.selectType !== 99) {
              sportPercentageDataset.push({
                name: this.translateService.instant('universal_activityData_aerobic'), y: this.data[4], color: '#9e9e9e'
              });
            } else {
              sportPercentageDataset.push({
                name: this.translateService.instant('universal_activityData_aerobic'), y: this.data[4], color: '#75f25f'
              });
            }
          break;
          case 5:
            if (this.selectType !== 6 && this.selectType !== 99) {
              sportPercentageDataset.push({
                name: this.translateService.instant('universal_sportsName_boating'), y: this.data[5], color: '#9e9e9e'
              });
            } else {
              sportPercentageDataset.push({
                name: this.translateService.instant('universal_sportsName_boating'), y: this.data[5], color: '#72e8b0'
              });
            }
          break;
          case 6:
            if (this.selectType !== 7 && this.selectType !== 99) {
              sportPercentageDataset.push({
                name: this.translateService.instant('universal_activityData_ballSports'), y: this.data[6], color: '#9e9e9e'
              });
            } else {
              sportPercentageDataset.push({
                name: this.translateService.instant('universal_activityData_ballSports'), y: this.data[6], color: '#6bebf9'
              });
            }
          break;
        }

      }

    }

    // 根據圖表清單依序將圖表顯示出來-kidin-1081217
    const ringChartOptions = new ChartOptions(sportPercentageDataset);
    this.createChart(ringChartOptions);
  }

  // 確認取得元素才建立圖表-kidin-1090706
  createChart (option: ChartOptions) {

    setTimeout (() => {
      if (!this.container) {
        this.createChart(option);
      } else {
        const chartDiv = this.container.nativeElement;
        chart(chartDiv, option);
      }
    }, 200);

  }

  ngOnDestroy () {}

}
