import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';

const Highcharts: any = _Highcharts; // 不檢查highchart型態

// 建立圖表用-kidin-1081212
class ChartOptions {
  constructor (dataset) {
    return {
      chart: {
        height: 100
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
                distance: 0,
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
        innerSize: '60%',
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

export class RingChartComponent implements OnInit, OnDestroy {

  @Input() data: Array<number>;

  @ViewChild('container')
  container: ElementRef;

  constructor(
    private translateService: TranslateService
  ) { }

  ngOnInit() {
    this.initInfoHighChart();
  }

  // 初始化highChart-kidin-1081211
  initInfoHighChart () {

    // 將之前生成的highchart卸除避免新生成的highchart無法顯示-kidin-1081219
    Highcharts.charts.forEach((_highChart, idx) => {
      if (_highChart !== undefined) {
        _highChart.destroy();
      }
    });

    const sportPercentageDataset = []
    Highcharts.charts.length = 0;  // 初始化global highchart物件，可避免HighCharts.Charts為 undefined -kidin-1081212
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i] !== 0) {
        switch (i) {
          case 0:
            sportPercentageDataset.push({
              name: this.translateService.instant('Dashboard.SportReport.run'), y: this.data[0], color: '#ea5757'
            });
            break;
          case 1:
            sportPercentageDataset.push({
              name: this.translateService.instant('Dashboard.SportReport.cycle'), y: this.data[1], color: '#ff9a22'
            });
          break;
          case 2:
            sportPercentageDataset.push({
              name: this.translateService.instant('Dashboard.SportReport.weightTraining'), y: this.data[2], color: '#f9cc3d'
            });
          break;
          case 3:
            sportPercentageDataset.push({
              name: this.translateService.instant('Dashboard.SportReport.swim'), y: this.data[3], color: '#cfef4b'
            });
          break;
          case 4:
            sportPercentageDataset.push({
              name: this.translateService.instant('Dashboard.SportReport.aerobic'), y: this.data[4], color: '#75f25f'
            });
          break;
          case 5:
            sportPercentageDataset.push({
              name: this.translateService.instant('Dashboard.SportReport.boating'), y: this.data[5], color: '#72e8b0'
            });
          break;
        }
      }
    }

    const ringChartOptions = new ChartOptions(sportPercentageDataset),
          ringChartDiv = this.container.nativeElement;

    // 根據圖表清單依序將圖表顯示出來-kidin-1081217
    setTimeout(() => {
      chart(ringChartDiv, ringChartOptions);
    }, 0);
  }

  ngOnDestroy () {
    // 將之前生成的highchart卸除避免新生成的highchart無法顯示-kidin-1081219
    Highcharts.charts.forEach((_highChart, idx) => {
      if (_highChart !== undefined) {
        _highChart.destroy();
      }
    });
  }

}
