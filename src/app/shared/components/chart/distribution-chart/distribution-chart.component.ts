import { Component, OnInit, Input, OnChanges } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-distribution-chart',
  templateUrl: './distribution-chart.component.html',
  styleUrls: ['./distribution-chart.component.scss']
})
export class DistributionChartComponent implements OnInit, OnChanges {
  @Input() typeList: Array<string>;
  @Input() perAvgHR: Array<any>;
  @Input() perActivityTime: Array<any>;
  @Input() HRRange: Array<any>;
  @Input() selectType: string;  // 先預埋根據運動類型過濾落點-kidin-1090131

  points = [];  // 落點用變數-kidin-1090130
  blockOne = 0; // 努力卻強度低落-kidin-1090131
  blockTwo = 0; // 需加強訓練強度-kidin-1090131
  blockThree = 0; // 持續量與強度不足-kidin-1090131
  blockFour = 0; // 努力且確實的訓練-kidin-1090131
  blockFive = 0; // 良好穩定的訓練-kidin-1090131
  blockSix = 0; // 持續時間需要再加強-kidin-1090131
  blockSeven = 0; // 易造成身體負擔-kidin-1090131
  blockEight = 0; // 適度高強度訓練-kidin-1090131
  blockNine = 0; // 短期爆發型訓練-kidin-1090131

  constructor() { }

  ngOnInit() { }

  ngOnChanges () {
    this.initVariable();
    this.initChart();
  }

  initVariable () {
    this.points = [];  // 落點用變數-kidin-1090130
    this.blockOne = 0; // 努力卻強度低落-kidin-1090131
    this.blockTwo = 0; // 需加強訓練強度-kidin-1090131
    this.blockThree = 0; // 持續量與強度不足-kidin-1090131
    this.blockFour = 0; // 努力且確實的訓練-kidin-1090131
    this.blockFive = 0; // 良好穩定的訓練-kidin-1090131
    this.blockSix = 0; // 持續時間需要再加強-kidin-1090131
    this.blockSeven = 0; // 易造成身體負擔-kidin-1090131
    this.blockEight = 0; // 適度高強度訓練-kidin-1090131
    this.blockNine = 0; // 短期爆發型訓練-kidin-1090131
  }

  initChart () {
    // 定義心率在每個區塊的x軸邊界值-kidin-1090213
    const range = Math.floor((this.HRRange[1] - this.HRRange[0]) / 3),
          boundary = [
            +this.HRRange[0],
            +this.HRRange[0] + range,
            +this.HRRange[0] + range * 2,
            +this.HRRange[1]
          ];

    for (let i = 0; i < this.perAvgHR.length; i++) {
      if (this.selectType === '99' || this.typeList[i] === this.selectType) {
        let y;
        if (this.perAvgHR[i] >= boundary[0] && this.perAvgHR[i] <= boundary[1]) {
          if (+this.perActivityTime[i] <= 1200) {
            y = this.getYPoint(this.perActivityTime[i], 0, 196);
            this.blockThree++;

          } else if (+this.perActivityTime[i] > 1200 && +this.perActivityTime[i] <= 2400) {
            y = this.getYPoint(this.perActivityTime[i], 1200, 131);
              this.blockTwo++;

          } else {
            y = this.getYPoint(+this.perActivityTime[i], 2400, 66);
            this.blockOne++;
          }

          this.points.push({
            x: this.getXPoint(this.perAvgHR[i], boundary[0], boundary[1], 44),
            y: y
          });

        } else if (this.perAvgHR[i] > boundary[1] && this.perAvgHR[i] <= boundary[2]) {
          if (+this.perActivityTime[i] <= 1200) {
            y = this.getYPoint(this.perActivityTime[i], 0, 196);
            this.blockSix++;

          } else if (+this.perActivityTime[i] > 1200 && +this.perActivityTime[i] <= 2400) {
            y = this.getYPoint(this.perActivityTime[i], 1200, 131);
            this.blockFive++;

          } else {
            y = this.getYPoint(this.perActivityTime[i], 2400, 66);
            this.blockFour++;
          }

          this.points.push({
            x: this.getXPoint(this.perAvgHR[i], boundary[1], boundary[2], 184),
            y: y
          });

        } else if (this.perAvgHR[i] > boundary[2]) {

          if (+this.perActivityTime[i] <= 1200) {
            y = this.getYPoint(this.perActivityTime[i], 0, 196);
            this.blockNine++;

          } else if (+this.perActivityTime[i] > 1200 && +this.perActivityTime[i] <= 2400) {
            y = this.getYPoint(this.perActivityTime[i], 1200, 131);
            this.blockEight++;

          } else {
            y = this.getYPoint(this.perActivityTime[i], 2400, 66);
            this.blockSeven++;
          }

          this.points.push({
            x: this.getXPoint(this.perAvgHR[i], boundary[2], boundary[3], 324),
            y: y
          });
        }
      }

    }
  }

  // 推算時間比例對比圖表該區高度給予y軸落點(不貼邊)-kidin-1090131
  getYPoint (time, section, yStart) {
    // 運動超過1小時皆為圖表最高點-kidin-1090131
    if (time / 3600 > 1) {
      return 14;
    } else {
      return yStart - (((time - section) / 1200) * 52);
    }
  }

  /* 推算根據心率值對比圖表該區寬度給予x軸落點(不貼邊)-kidin-1090131 */
  getXPoint (hr, min, max, xStart) {
    // 心率超過z5則落在圖表最右邊-kidin-1090213
    if (hr > this.HRRange[1]) {
      return 127 + xStart;
    } else {
      return ((hr - min) / (max - min) * 127) + xStart;
    }
  }

}
