import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  ViewChild,
  ElementRef,
  Input,
} from '@angular/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { zoneColor } from '../../../../core/models/represent-color';
import Highcharts from 'highcharts';
import { chart } from 'highcharts';
import Treemap from 'highcharts/modules/treemap';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  getHrZoneTranslation,
  getFtpZoneTranslation,
  getMuscleGroupTranslation,
  mathRounding,
} from '../../../../core/utils';
import { NgIf } from '@angular/common';

// highchart 引入 tree map
Treemap(Highcharts);

@Component({
  selector: 'app-tree-map-chart',
  templateUrl: './tree-map-chart.component.html',
  styleUrls: ['./tree-map-chart.component.scss'],
  standalone: true,
  imports: [NgIf, TranslateModule],
})
export class TreeMapChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() zoneInfo: {
    type: string;
    data: Array<number>;
  };

  @ViewChild('container', { static: false })
  container: ElementRef;

  /**
   * 是否沒有區間數據
   */
  noData = true;

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {}

  ngOnChanges() {
    if (!this.zoneInfo.data) {
      this.noData = true;
    } else {
      this.noData = this.zoneInfo.data.reduce((prev, current) => prev + current) === 0;
      if (this.noData) return false;

      of(this.zoneInfo)
        .pipe(
          map((zoneInfo) => [zoneInfo.data, this.getZoneTranslate(zoneInfo.type)]),
          map(([data, translation]) => this.initChart(data, translation)),
          map((chartData) => this.createChart(chartData))
        )
        .subscribe();
    }
  }

  /**
   * 取得該區間對應的多國語系翻譯
   * @param type {string}-心率區間或閾值區間
   * @author kidin-1110413
   */
  getZoneTranslate(type: string) {
    switch (type) {
      case 'hrZone':
        return getHrZoneTranslation(this.translate);
      case 'ftpZone':
        return getFtpZoneTranslation(this.translate);
      case 'muscleGroup':
        return getMuscleGroupTranslation(this.translate);
    }
  }

  /**
   * 初始化圖表
   * @param data {Array<number>}-圖表所需數據
   * @param translation Array<string>-各區間翻譯詞彙
   */
  initChart(data: Array<number>, translation: Array<string>) {
    const chartOption = new ChartOption(data, translation);
    return chartOption.option;
  }

  /**
   * 建立圖表
   * @param option {any}-圖表設定值
   * @author kidin-1110413
   */
  createChart(option: any) {
    setTimeout(() => {
      if (!this.container) {
        this.createChart(option);
      } else {
        const chartDiv = this.container.nativeElement;
        chart(chartDiv, option);
      }
    }, 200);
  }

  ngOnDestroy(): void {}
}

/**
 * 圖表設定相關
 */
class ChartOption {
  private _option = {
    chart: {
      height: 200,
      backgroundColor: 'transparent',
    },
    credits: {
      enabled: false,
    },
    series: [
      {
        type: 'treemap',
        data: <Array<any>>[
          {
            id: '0',
            name: '',
            color: zoneColor[0],
          },
          {
            id: '1',
            name: '',
            color: zoneColor[1],
          },
          {
            id: '2',
            name: '',
            color: zoneColor[2],
          },
          {
            id: '3',
            name: '',
            color: zoneColor[3],
          },
          {
            id: '4',
            name: '',
            color: zoneColor[4],
          },
          {
            id: '5',
            name: '',
            color: zoneColor[5],
          },
          {
            id: '6',
            name: '',
            color: zoneColor[6],
          },
        ],
      },
    ],
    title: {
      text: '',
    },
    tooltip: {
      formatter: function () {
        return this.point.translate;
      },
    },
  };

  constructor(zoneData: Array<number>, translation: Array<string>) {
    of(zoneData)
      .pipe(
        map((data) => this.countPercentage(data)),
        map((percentageData) => this.insertData(percentageData, translation))
      )
      .subscribe();
  }

  /**
   * 計算各心率區間佔比
   * @param data {Array<number>}-各心率區間總秒數
   */
  countPercentage(data: Array<number>) {
    const totalSecond = data.reduce((prev, current) => prev + current);
    return data.map((_data) => mathRounding(totalSecond ? (_data / totalSecond) * 100 : 0, 1));
  }

  /**
   * 將數據與翻譯寫進圖表設定內
   * @param data {Array<number>}-圖表所需數據
   * @param translation Array<string>-各區間翻譯詞彙
   */
  insertData(data: Array<number>, translation: Array<string>) {
    data.forEach((_data, _index) => {
      const oneZoneData = {
        name: `${_data}%`,
        parent: `${_index}`,
        value: _data,
        translate: translation[_index],
      };

      this._option.series[0].data.push(oneZoneData);
    });
  }

  /**
   * 取得圖表相關設定與數據
   */
  get option() {
    return this._option;
  }
}
