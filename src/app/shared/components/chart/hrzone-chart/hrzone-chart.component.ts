import { Component, OnInit, OnDestroy, OnChanges, ViewChild, ElementRef, Input } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';

const Highcharts: any = _Highcharts; // 不檢查highchart型態

// 建立圖表用-kidin-1081212
class ChartOptions {
  constructor (dataset) {
    return {
      chart: {
        height: 300
      },
      title: {
        text: ''
      },
      credits: {
        enabled: false
      },
      xAxis: {
        categories: [],
        title: {
          enabled: false
        }
      },
      yAxis: {
        labels: '',
        title: {
          enabled: false
        }
      },
      plotOptions: {
        column: {
            pointPlacement: 0,
        },
        series: {
          pointPadding: 0,
          groupPadding: 0
        }
      },
      tooltip: {
        pointFormat: '{point.y}%',
        valueDecimals: 1
      },
      series: [{
        type: 'column',
        data: dataset,
        showInLegend: false
      }]
    };
  }
}

@Component({
  selector: 'app-hrzone-chart',
  templateUrl: './hrzone-chart.component.html',
  styleUrls: ['./hrzone-chart.component.scss']
})
export class HrzoneChartComponent implements OnInit, OnChanges, OnDestroy {
  noHRZoneData = true;

  highestHRZone = '';
  highestHRZoneValue = 0;
  highestHRZoneColor = '';

  @Input() data: Array<number>;
  @Input() isPrint: boolean;
  @Input() type: string;

  @ViewChild('container')
  container: ElementRef;

  constructor(
    private translateService: TranslateService
  ) { }

  ngOnInit() { }

  ngOnChanges () {
    if (this.data.reduce((accumulator, current) => accumulator + current) === 0) {
      this.noHRZoneData = true;
    } else {
      this.noHRZoneData = false;
    }

    this.initInfoHighChart();
  }

  // 初始化highChart-kidin-1081211
  initInfoHighChart () {
    Highcharts.charts.length = 0;  // 初始化global highchart物件，可避免HighCharts.Charts為 undefined -kidin-1081212
    this.highestHRZoneValue = 0;

    const totalSecond = this.data.reduce((accumulator, current) => accumulator + current),
          zoneZeroPercentage = (this.data[0] / totalSecond) * 100,
          zoneOnePercentage = (this.data[1] / totalSecond) * 100,
          zoneTwoPercentage = (this.data[2] / totalSecond) * 100,
          zoneThreePercentage = (this.data[3] / totalSecond) * 100,
          zoneFourPercentage = (this.data[4] / totalSecond) * 100,
          zoneFivePercentage = (this.data[5] / totalSecond) * 100;

    const sportPercentageDataset = [
      {y: zoneZeroPercentage, color: '#70b1f3'},
      {y: zoneOnePercentage, color: '#64e0ec'},
      {y: zoneTwoPercentage, color: '#abf784'},
      {y: zoneThreePercentage, color: '#f7f25b'},
      {y: zoneFourPercentage, color: '#f3b353'},
      {y: zoneFivePercentage, color: '#f36953'},
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
          this.highestHRZone = this.translateService.instant('Dashboard.GroupClass.limit_generalZone');
          this.highestHRZoneColor = 'rgb(70, 156, 245)';
          break;
        case 1:
          this.highestHRZone = this.translateService.instant('Dashboard.GroupClass.warmUpZone');
          this.highestHRZoneColor = 'rgb(64, 218, 232)';
          break;
        case 2:
          this.highestHRZone = this.translateService.instant('Dashboard.GroupClass.aerobicZone');
          this.highestHRZoneColor = 'rgb(86, 255, 0)';
          break;
        case 3:
          this.highestHRZone = this.translateService.instant('Dashboard.GroupClass.enduranceZone');
          this.highestHRZoneColor = 'rgb(214, 207, 1)';
          break;
        case 4:
          this.highestHRZone = this.translateService.instant('Dashboard.GroupClass.marathonZone');
          this.highestHRZoneColor = 'rgb(234, 164, 4)';
          break;
        case 5:
          this.highestHRZone = this.translateService.instant('Dashboard.GroupClass.anaerobicZone');
          this.highestHRZoneColor = 'rgba(243, 105, 83)';
          break;
      }

      const HRChartOptions = new ChartOptions(sportPercentageDataset),
            HRChartDiv = this.container.nativeElement;

      HRChartOptions['series'][0].dataLabels = {
        enabled: true,
        formatter: function () {
          return this.y.toFixed(1) + '%';
        }
      };

      HRChartOptions['xAxis'].categories = [
        this.translateService.instant('Dashboard.GroupClass.limit_generalZone'),
        this.translateService.instant('Dashboard.GroupClass.warmUpZone'),
        this.translateService.instant('Dashboard.GroupClass.aerobicZone'),
        this.translateService.instant('Dashboard.GroupClass.enduranceZone'),
        this.translateService.instant('Dashboard.GroupClass.marathonZone'),
        this.translateService.instant('Dashboard.GroupClass.anaerobicZone')
      ];

      HRChartOptions['yAxis'].labels = {
        formatter: function () {
          return this.value + '%';
        }
      };

      // 處理列印時highchart無法自適應造成跑版的問題-kidin-1090211
      if (location.search.indexOf('ipm=s') > -1) {
        HRChartOptions['chart'].width = 540;
      }

      // 根據圖表清單依序將圖表顯示出來-kidin-1081217
      setTimeout(() => {
        chart(HRChartDiv, HRChartOptions);
      }, 200);

    } else {

      const HRChartOptions = new ChartOptions(sportPercentageDataset),
            HRChartDiv = this.container.nativeElement;

      HRChartOptions['chart'] = {
        margin: [2, 0, 2, 0],
        height: 40,
        style: {
            overflow: 'visible'
        },
        backgroundColor: 'transparent'
      };

      HRChartOptions['xAxis'] = {
        labels: {
            enabled: false
        },
        title: {
            text: null
        },
        startOnTick: false,
        endOnTick: false,
        tickPositions: []
      };

      HRChartOptions['yAxis'] = {
        endOnTick: false,
        startOnTick: false,
        labels: {
            enabled: false
        },
        title: {
            text: null
        },
        tickPositions: [0]
      };

      HRChartOptions['tooltip'] = {
        hideDelay: 0,
        outside: true,
        headerFormat: null,
        pointFormat: '{point.y}%',
        valueDecimals: 1
      };

      HRChartOptions['plotOptions'].column['pointPlacement'] = 0;
      HRChartOptions['legend'] = {
        enabled: false
      };

      HRChartOptions['chart'].zoomType = '';

      // 根據圖表清單依序將圖表顯示出來-kidin-1081217
      setTimeout(() => {
        chart(HRChartDiv, HRChartOptions);
      }, 200);

    }

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
