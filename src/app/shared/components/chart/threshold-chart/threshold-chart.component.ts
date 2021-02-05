import { Component, OnInit, OnDestroy, OnChanges, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const Highcharts: any = _Highcharts; // 不檢查highchart型態

/**
 * 建立圖表用
 * @constructs dataset {any}
 * @author kidin-1081212
 */
class ChartOptions {
  constructor (dataset: any) {
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
  selector: 'app-threshold-chart',
  templateUrl: './threshold-chart.component.html',
  styleUrls: ['./threshold-chart.component.scss']
})
export class ThresholdChartComponent implements OnInit, OnChanges, OnDestroy {

  private ngUnsubscribe = new Subject();

  noFtpZoneData = true;
  highestFtpZone = '';
  highestFtpZoneValue = 0;
  highestFtpZoneColor = '';

  @Input() data: Array<number>; // 各區間總秒數，ex.[992, 123, 1534, 1234, 1231, 321, 123]
  @Input() isPrint: boolean;
  @Input() type: 'mixFtpZone' | 'personalAnalysis';
  @Output() checkData: EventEmitter<boolean> = new EventEmitter();

  @ViewChild('container', {static: false})
  container: ElementRef;

  constructor(
    private translateService: TranslateService
  ) { }

  ngOnInit() {
  }

  ngOnChanges () {
    if (this.data.reduce((accumulator, current) => accumulator + current) === 0) {
      this.noFtpZoneData = true;
    } else {
      this.noFtpZoneData = false;
    }

    this.checkData.emit(this.noFtpZoneData);
    this.initInfoHighChart();
  }

  /**
   * 初始化highChart
   * @author kidin-1081211
   */
  initInfoHighChart () {
    this.translateService.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      const zoneZero = `${this.translateService.instant('universal_activityData_ftpZ0')}`,
            zoneOne = `${this.translateService.instant('universal_activityData_ftpZ1')}`,
            zoneTwo = `${this.translateService.instant('universal_activityData_ftpZ2')}`,
            zoneThree = `${this.translateService.instant('universal_activityData_ftpZ3')}`,
            zoneFour = `${this.translateService.instant('universal_activityData_ftpZ4')}`,
            zoneFive = `${this.translateService.instant('universal_activityData_ftpZ5')}`,
            zoneSix = `${this.translateService.instant('universal_activityData_ftpZ6')}`;

      this.highestFtpZoneValue = 0;

      const totalSecond = this.data.reduce((accumulator, current) => accumulator + current),
            zoneZeroPercentage = (this.data[0] / totalSecond) * 100,
            zoneOnePercentage = (this.data[1] / totalSecond) * 100,
            zoneTwoPercentage = (this.data[2] / totalSecond) * 100,
            zoneThreePercentage = (this.data[3] / totalSecond) * 100,
            zoneFourPercentage = (this.data[4] / totalSecond) * 100,
            zoneFivePercentage = (this.data[5] / totalSecond) * 100,
            zoneSixPercentage = (this.data[6] / totalSecond) * 100;

      const sportPercentageDataset = [
        {y: zoneZeroPercentage, color: '#70b1f3'},
        {y: zoneOnePercentage, color: '#64e0ec'},
        {y: zoneTwoPercentage, color: '#abf784'},
        {y: zoneThreePercentage, color: '#f7f25b'},
        {y: zoneFourPercentage, color: '#f3b353'},
        {y: zoneFivePercentage, color: '#f36953'},
        {y: zoneSixPercentage, color: '#ea57a3'},
      ];

      if (this.type !== 'personalAnalysis') {

        // 取得最高占比的區間-kidin-1090130
        let highestFtpZoneIndex = 0;
        for (let i = 0; i < 6; i++) {
          if (sportPercentageDataset[i].y > this.highestFtpZoneValue) {
            this.highestFtpZoneValue = sportPercentageDataset[i].y;
            highestFtpZoneIndex = i;
          }
        }

        switch (highestFtpZoneIndex) {
          case 0:
            this.highestFtpZone = zoneZero;
            this.highestFtpZoneColor = 'rgb(70, 156, 245)';
            break;
          case 1:
            this.highestFtpZone = zoneOne;
            this.highestFtpZoneColor = 'rgb(64, 218, 232)';
            break;
          case 2:
            this.highestFtpZone = zoneTwo;
            this.highestFtpZoneColor = 'rgb(86, 255, 0)';
            break;
          case 3:
            this.highestFtpZone = zoneThree;
            this.highestFtpZoneColor = 'rgb(214, 207, 1)';
            break;
          case 4:
            this.highestFtpZone = zoneFour;
            this.highestFtpZoneColor = 'rgb(234, 164, 4)';
            break;
          case 5:
            this.highestFtpZone = zoneFive;
            this.highestFtpZoneColor = 'rgb(243, 105, 83)';
            break;
          case 6:
            this.highestFtpZone = zoneSix;
            this.highestFtpZoneColor = 'rgb(239, 56, 150)';
            break;
        }

        const HRChartOptions = new ChartOptions(sportPercentageDataset);

        HRChartOptions['series'][0].dataLabels = {
          enabled: true,
          formatter: function () {
            return this.y.toFixed(1) + '%';
          }
        };

        HRChartOptions['xAxis'].categories = [
          zoneZero,
          zoneOne,
          zoneTwo,
          zoneThree,
          zoneFour,
          zoneFive,
          zoneSix
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

        this.createChart(HRChartOptions);

      } else {

        const HRChartOptions = new ChartOptions(sportPercentageDataset);

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
        this.createChart(HRChartOptions);
      }

    });

  }

  /**
   * 確認取得元素才建立圖表
   * @param option {ChartOptions}
   * @author kidin-1090706
   */
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

  ngOnDestroy () {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
