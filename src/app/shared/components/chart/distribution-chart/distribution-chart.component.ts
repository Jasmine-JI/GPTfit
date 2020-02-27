import { Component, OnInit, Input, OnChanges } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-distribution-chart',
  templateUrl: './distribution-chart.component.html',
  styleUrls: ['./distribution-chart.component.scss']
})
export class DistributionChartComponent implements OnInit, OnChanges {
  // 運動報告用變數-kidin-1090218
  @Input() typeList: Array<string>;
  @Input() perAvgHR: Array<any>;
  @Input() perActivityTime: Array<any>;
  @Input() HRRange: Array<any>;
  @Input() selectType: string;

  // 生活追蹤用變數
  @Input() perFFMI: Array<any>;
  @Input() perFatRate: Array<any>;
  @Input() gender: Array<any>;
  xBoundary = [];
  yBoundary = [];

  reportType = '';

  points = [];  // 落點用變數-kidin-1090130
  blockOne = 0; // 左上區塊-kidin-1090131
  blockTwo = 0; // 左中區塊-kidin-1090131
  blockThree = 0; // 左下區塊-kidin-1090131
  blockFour = 0; // 中上區塊-kidin-1090131
  blockFive = 0; // 中中區塊-kidin-1090131
  blockSix = 0; // 中下區塊-kidin-1090131
  blockSeven = 0; // 右上區塊-kidin-1090131
  blockEight = 0; // 右中區塊-kidin-1090131
  blockNine = 0; // 右下區塊-kidin-1090131

  constructor() { }

  ngOnInit() { }

  ngOnChanges () {
    this.initVariable();

    if (this.perActivityTime) {
      this.reportType = 'sport';
      this.initRePortChart();
    } else if (this.perFFMI) {
      this.reportType = 'lifeTracking';
      this.initLifeTrackingChart();
    }

  }

  // 初始化變數-kidin-1090131
  initVariable () {
    this.points = [];
    this.blockOne = 0;
    this.blockTwo = 0;
    this.blockThree = 0;
    this.blockFour = 0;
    this.blockFive = 0;
    this.blockSix = 0;
    this.blockSeven = 0;
    this.blockEight = 0;
    this.blockNine = 0;
  }

  // 運動報告用圖表-kidin-1090218
  initRePortChart () {
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
            y = this.getYPoint(this.perActivityTime[i], 0, 196, 1200, 3600);
            this.blockThree++;

          } else if (+this.perActivityTime[i] > 1200 && +this.perActivityTime[i] <= 2400) {
            y = this.getYPoint(this.perActivityTime[i], 1200, 131, 1200, 3600);
              this.blockTwo++;

          } else {
            y = this.getYPoint(+this.perActivityTime[i], 2400, 66, 1200, 3600);
            this.blockOne++;
          }

          this.points.push({
            x: this.getXPoint(this.perAvgHR[i], boundary[0], boundary[1], 44, this.HRRange[1]),
            y: y
          });

        } else if (this.perAvgHR[i] > boundary[1] && this.perAvgHR[i] <= boundary[2]) {
          if (+this.perActivityTime[i] <= 1200) {
            y = this.getYPoint(this.perActivityTime[i], 0, 196, 1200, 3600);
            this.blockSix++;

          } else if (+this.perActivityTime[i] > 1200 && +this.perActivityTime[i] <= 2400) {
            y = this.getYPoint(this.perActivityTime[i], 1200, 131, 1200, 3600);
            this.blockFive++;

          } else {
            y = this.getYPoint(this.perActivityTime[i], 2400, 66, 1200, 3600);
            this.blockFour++;
          }

          this.points.push({
            x: this.getXPoint(this.perAvgHR[i], boundary[1], boundary[2], 184, this.HRRange[1]),
            y: y
          });

        } else if (this.perAvgHR[i] > boundary[2]) {

          if (+this.perActivityTime[i] <= 1200) {
            y = this.getYPoint(this.perActivityTime[i], 0, 196, 1200, 3600);
            this.blockNine++;

          } else if (+this.perActivityTime[i] > 1200 && +this.perActivityTime[i] <= 2400) {
            y = this.getYPoint(this.perActivityTime[i], 1200, 131, 1200, 3600);
            this.blockEight++;

          } else {
            y = this.getYPoint(this.perActivityTime[i], 2400, 66, 1200, 3600);
            this.blockSeven++;
          }

          this.points.push({
            x: this.getXPoint(this.perAvgHR[i], boundary[2], boundary[3], 324, this.HRRange[1]),
            y: y
          });
        }
      }

    }
  }

  // 生活追蹤用圖表-kidin-1090218
  initLifeTrackingChart () {
    for (let i = 0; i < this.perFFMI.length; i++) {
      if (this.gender[i] === 0) {
        this.xBoundary = [18, 21, 28];
        this.yBoundary = [17, 21, 50];
      } else {
        this.xBoundary = [15, 18, 25];
        this.yBoundary = [23, 27, 56];
      }

      let y;
      if (this.perFFMI[i] < this.xBoundary[0]) {
        if (+this.perFatRate[i] <= this.yBoundary[0]) {
          y = this.getYPoint(this.perFatRate[i], 0, 196, this.yBoundary[0], this.yBoundary[2]);
          this.blockThree++;

        } else if (+this.perFatRate[i] > this.yBoundary[0] && +this.perFatRate[i] <= this.yBoundary[1]) {
          y = this.getYPoint(this.perFatRate[i], this.yBoundary[0], 131, this.yBoundary[1] - this.yBoundary[0], this.yBoundary[2]);
            this.blockTwo++;

        } else {
          y = this.getYPoint(+this.perFatRate[i], this.yBoundary[1], 66, this.yBoundary[2] - this.yBoundary[1], this.yBoundary[2]);
          this.blockOne++;
        }

        this.points.push({
          x: this.getXPoint(this.perFFMI[i], 0, this.xBoundary[0], 44, this.xBoundary[2]),
          y: y
        });

      } else if (this.perFFMI[i] >= this.xBoundary[0] && this.perFFMI[i] <= this.xBoundary[1]) {
        if (+this.perFatRate[i] <= this.yBoundary[0]) {
          y = this.getYPoint(this.perFatRate[i], 0, 196, this.yBoundary[0], this.yBoundary[2]);
          this.blockSix++;

        } else if (+this.perFatRate[i] > this.yBoundary[0] && +this.perFatRate[i] <= this.yBoundary[1]) {
          y = this.getYPoint(this.perFatRate[i], this.yBoundary[0], 131, this.yBoundary[1] - this.yBoundary[0], this.yBoundary[2]);
          this.blockFive++;

        } else {
          y = this.getYPoint(this.perFatRate[i], this.yBoundary[1], 66, this.yBoundary[2] - this.yBoundary[1], this.yBoundary[2]);
          this.blockFour++;
        }

        this.points.push({
          x: this.getXPoint(this.perFFMI[i], this.xBoundary[0], this.xBoundary[1], 184, this.xBoundary[2]),
          y: y
        });

      } else if (this.perFFMI[i] > this.xBoundary[1]) {

        if (+this.perFatRate[i] <= this.yBoundary[0]) {
          y = this.getYPoint(this.perFatRate[i], 0, 196, this.yBoundary[0], this.yBoundary[2]);
          this.blockNine++;

        } else if (+this.perFatRate[i] > this.yBoundary[0] && +this.perFatRate[i] <= this.yBoundary[1]) {
          y = this.getYPoint(this.perFatRate[i], this.yBoundary[0], 131, this.yBoundary[1] - this.yBoundary[0], this.yBoundary[2]);
          this.blockEight++;

        } else {
          y = this.getYPoint(this.perFatRate[i], this.yBoundary[1], 66, this.yBoundary[2] - this.yBoundary[1], this.yBoundary[2]);
          this.blockSeven++;
        }

        this.points.push({
          x: this.getXPoint(this.perFFMI[i], this.xBoundary[1], this.xBoundary[2], 324, this.xBoundary[2]),
          y: y
        });
      }

    }
  }

  // 根據y點比例對比圖表該區高度給予y軸落點(不貼邊)-kidin-1090131
  getYPoint (y, section, yStart, yScale, yMax) {
    if (y / yMax > 1) {
      return 14;
    } else {
      return yStart - (((y - section) / yScale) * 52);
    }

  }

  /* 根據x點比例對比圖表該區寬度給予x軸落點(不貼邊)-kidin-1090131 */
  getXPoint (x, min, max, xStart, xMax) {
    if (x > xMax) {
      return 127 + xStart;
    } else {
      return ((x - min) / (max - min) * 127) + xStart;
    }
  }

}
