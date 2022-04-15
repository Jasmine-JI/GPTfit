import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, OnChanges } from '@angular/core';
import { SportType } from '../../../enum/sports';
import { TranslateService } from '@ngx-translate/core';
import { chart } from 'highcharts';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SPORT_TYPE_COLOR } from '../../../models/chart-data';


// 建立圖表用-kidin-1081212
class ChartOptions {
  constructor (dataset) {
    return {
      chart: {
        height: 200,
        margin: [0, 0, 0, 0],
        backgroundColor: 'transparent'
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
            distance: -15,
            formatter: function () {
              return Math.round(this.point.percentage) + '%';
            },
            style: {
              fontWeight: 'bold',
              fontSize: '10px',
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

export class RingChartComponent implements OnInit, OnChanges, OnDestroy {
  private ngUnsubscribe = new Subject;

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
    this.translateService.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      const sportPercentageDataset = [];
      for (let i = 0; i < this.data.length; i++) {
        if (this.data[i] !== 0) {
          const sportType = i + 1;
          let key: string;
          switch (sportType) {
            case SportType.run:
              key = 'universal_activityData_run';
              break;
            case SportType.cycle:
              key = 'universal_activityData_cycle';
            break;
            case SportType.weightTrain:
              key = 'universal_activityData_weightTraining';
            break;
            case SportType.swim:
              key = 'universal_activityData_swin';
            break;
            case SportType.aerobic:
              key = 'universal_activityData_aerobic';
            break;
            case SportType.row:
              key = 'universal_sportsName_boating';
            break;
            case SportType.ball:
              key = 'universal_activityData_ballSports';
            break;
          }

          sportPercentageDataset.push({
            name: this.translateService.instant(key),
            y: this.data[i],
            color: [SportType.all, sportType].includes(this.selectType) ? SPORT_TYPE_COLOR[i] : '#9e9e9e'
          });

        }

      }

      // 根據圖表清單依序將圖表顯示出來-kidin-1081217
      const ringChartOptions = new ChartOptions(sportPercentageDataset);
      this.createChart(ringChartOptions);
    });

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

  ngOnDestroy () {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
