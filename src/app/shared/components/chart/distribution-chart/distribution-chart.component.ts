import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SportCode } from '../../../models/report-condition';

/**
 * 運動成效分佈圖
 * @註 適用日報告和週報告，以及不同運動類型(全類型其不同類型的點不合併)。
 * @export
 * @class DistributionChartComponent
 * @implements {OnInit}
 * @implements {OnChanges}
 * @author kidin-1090715
 */
@Component({
  selector: 'app-distribution-chart',
  templateUrl: './distribution-chart.component.html',
  styleUrls: ['./distribution-chart.component.scss']
})


export class DistributionChartComponent implements OnInit, OnChanges {
  // 運動報告用變數-kidin-1090218
  @Input() typeList: Array<number>;
  @Input() perAvgHR: Array<any>;
  @Input() perActivityTime: Array<any>;
  @Input() HRRange: Array<any>;
  @Input() selectType: number;

  // 生活追蹤用變數
  @Input() data: Array<any>;
  xBoundary = [];
  yBoundary = [];

  floatText = true;
  reportType = '';

  points = [];  // 落點用變數-kidin-1090130

  // 左上區塊-kidin-1090323
  blockOne = {
    stroke: 0,
    percentage: '0%'
  };

  // 左中區塊-kidin-1090131
  blockTwo = {
    stroke: 0,
    percentage: '0%'
  };

  // 左下區塊-kidin-1090323
  blockThree = {
    stroke: 0,
    percentage: '0%'
  };

  // 中上區塊-kidin-1090323
  blockFour = {
    stroke: 0,
    percentage: '0%'
  };

  // 中中區塊-kidin-1090323
  blockFive = {
    stroke: 0,
    percentage: '0%'
  };

  // 中下區塊-kidin-1090323
  blockSix = {
    stroke: 0,
    percentage: '0%'
  };

  // 右上區塊-kidin-1090323
  blockSeven = {
    stroke: 0,
    percentage: '0%'
  };

  // 右中區塊-kidin-1090323
  blockEight = {
    stroke: 0,
    percentage: '0%'
  };

  // 右下區塊-kidin-1090323
  blockNine = {
    stroke: 0,
    percentage: '0%'
  };

  baseUrl = window.location.href;

  constructor() { }

  ngOnInit() {
    this.fixSvgUrls();
  }

  ngOnChanges () {
    this.initVariable();

    if (this.perActivityTime) {
      this.reportType = 'sport';
      this.initRePortChart();
    } else if (this.data) {
      this.reportType = 'lifeTracking';
      this.initLifeTrackingChart();
    }

  }

  /**
   * 初始化變數
   * @author kidin-1090131
   */
  initVariable () {
    // 左上區塊-kidin-1090323
    this.blockOne = {
      stroke: 0,
      percentage: '0%'
    };

    // 左中區塊-kidin-1090131
    this.blockTwo = {
      stroke: 0,
      percentage: '0%'
    };

    // 左下區塊-kidin-1090323
    this.blockThree = {
      stroke: 0,
      percentage: '0%'
    };

    // 中上區塊-kidin-1090323
    this.blockFour = {
      stroke: 0,
      percentage: '0%'
    };

    // 中中區塊-kidin-1090323
    this.blockFive = {
      stroke: 0,
      percentage: '0%'
    };

    // 中下區塊-kidin-1090323
    this.blockSix = {
      stroke: 0,
      percentage: '0%'
    };

    // 右上區塊-kidin-1090323
    this.blockSeven = {
      stroke: 0,
      percentage: '0%'
    };

    // 右中區塊-kidin-1090323
    this.blockEight = {
      stroke: 0,
      percentage: '0%'
    };

    // 右下區塊-kidin-1090323
    this.blockNine = {
      stroke: 0,
      percentage: '0%'
    };

    this.points = [];
  }

  /**
   * 運動報告用圖表
   * @author kidin-1090218
   */
  initRePortChart () {
    // 定義心率在每個區塊的x軸邊界值，取不到心率區間則設z5的預設值為190-kidin-1090213
    let range,
        boundary,
        total = 0;
    if (this.HRRange[1] === 'Z5') {
      range = Math.floor((190 - this.HRRange[0]) / 3),
      boundary = [
        +this.HRRange[0],
        +this.HRRange[0] + range,
        +this.HRRange[0] + range * 2,
        190
      ];
    } else {
      range = Math.floor((this.HRRange[1] - this.HRRange[0]) / 3),
      boundary = [
        +this.HRRange[0],
        +this.HRRange[0] + range,
        +this.HRRange[0] + range * 2,
        +this.HRRange[1]
      ];
    }

    for (let i = 0, len = this.perAvgHR.length; i < len; i++) {
      if (this.selectType === SportCode.all || this.typeList[i] == this.selectType) {
        let y;
        if (this.perAvgHR[i] >= boundary[0] && this.perAvgHR[i] <= boundary[1]) {
          if (+this.perActivityTime[i] <= 1200) {
            y = this.getYPoint(this.perActivityTime[i], 0, 196, 1200, 3600);
            this.blockThree.stroke++;
            total++;

          } else if (+this.perActivityTime[i] > 1200 && +this.perActivityTime[i] <= 2400) {
            y = this.getYPoint(this.perActivityTime[i], 1200, 131, 1200, 3600);
            this.blockTwo.stroke++;
            total++;

          } else {
            y = this.getYPoint(+this.perActivityTime[i], 2400, 66, 1200, 3600);
            this.blockOne.stroke++;
            total++;
          }

          this.points.push({
            x: this.getXPoint(this.perAvgHR[i], boundary[0], boundary[1], 44, this.HRRange[1]),
            y: y
          });

        } else if (this.perAvgHR[i] > boundary[1] && this.perAvgHR[i] <= boundary[2]) {
          if (+this.perActivityTime[i] <= 1200) {
            y = this.getYPoint(this.perActivityTime[i], 0, 196, 1200, 3600);
            this.blockSix.stroke++;
            total++;

          } else if (+this.perActivityTime[i] > 1200 && +this.perActivityTime[i] <= 2400) {
            y = this.getYPoint(this.perActivityTime[i], 1200, 131, 1200, 3600);
            this.blockFive.stroke++;
            total++;

          } else {
            y = this.getYPoint(this.perActivityTime[i], 2400, 66, 1200, 3600);
            this.blockFour.stroke++;
            total++;
          }

          this.points.push({
            x: this.getXPoint(this.perAvgHR[i], boundary[1], boundary[2], 184, this.HRRange[1]),
            y: y
          });

        } else if (this.perAvgHR[i] > boundary[2]) {

          if (+this.perActivityTime[i] <= 1200) {
            y = this.getYPoint(this.perActivityTime[i], 0, 196, 1200, 3600);
            this.blockNine.stroke++;
            total++;

          } else if (+this.perActivityTime[i] > 1200 && +this.perActivityTime[i] <= 2400) {
            y = this.getYPoint(this.perActivityTime[i], 1200, 131, 1200, 3600);
            this.blockEight.stroke++;
            total++;

          } else {
            y = this.getYPoint(this.perActivityTime[i], 2400, 66, 1200, 3600);
            this.blockSeven.stroke++;
            total++;
          }

          this.points.push({
            x: this.getXPoint(this.perAvgHR[i], boundary[2], boundary[3], 324, this.HRRange[1]),
            y: y
          });
        }
      }

    }

    this.calPercentage(total);
  }

  /**
   * 生活追蹤用圖表
   * @author kidin-1090218
   */
  initLifeTrackingChart () {
    let total = 0;
    for (let i = 0, len = this.data.length; i < len; i++) {
      const { FFMI, fatRate, gender } = this.data[i];
      if (gender === 0) {
        this.xBoundary = [18, 21, 28];
        this.yBoundary = [17, 21, 50];
      } else {
        this.xBoundary = [15, 18, 25];
        this.yBoundary = [23, 27, 56];
      }

      let y;
      if (FFMI < this.xBoundary[0]) {

        if (fatRate <= this.yBoundary[0]) {
          y = this.getYPoint(fatRate, 0, 196, this.yBoundary[0], this.yBoundary[2]);
          this.blockThree.stroke++;
          total++;

        } else if (fatRate > this.yBoundary[0] && fatRate <= this.yBoundary[1]) {
          y = this.getYPoint(fatRate, this.yBoundary[0], 131, this.yBoundary[1] - this.yBoundary[0], this.yBoundary[2]);
          this.blockTwo.stroke++;
          total++;

        } else {
          y = this.getYPoint(fatRate, this.yBoundary[1], 66, this.yBoundary[2] - this.yBoundary[1], this.yBoundary[2]);
          this.blockOne.stroke++;
          total++;
        }

        this.points.push({
          x: this.getXPoint(FFMI, 0, this.xBoundary[0], 44, this.xBoundary[2]),
          y: y
        });

      } else if (FFMI >= this.xBoundary[0] && FFMI <= this.xBoundary[1]) {

        if (fatRate <= this.yBoundary[0]) {
          y = this.getYPoint(fatRate, 0, 196, this.yBoundary[0], this.yBoundary[2]);
          this.blockSix.stroke++;
          total++;

        } else if (fatRate > this.yBoundary[0] && fatRate <= this.yBoundary[1]) {
          y = this.getYPoint(fatRate, this.yBoundary[0], 131, this.yBoundary[1] - this.yBoundary[0], this.yBoundary[2]);
          this.blockFive.stroke++;
          total++;

        } else {
          y = this.getYPoint(fatRate, this.yBoundary[1], 66, this.yBoundary[2] - this.yBoundary[1], this.yBoundary[2]);
          this.blockFour.stroke++;
          total++;
        }

        this.points.push({
          x: this.getXPoint(FFMI, this.xBoundary[0], this.xBoundary[1], 184, this.xBoundary[2]),
          y: y
        });

      } else if (FFMI > this.xBoundary[1]) {

        if (fatRate <= this.yBoundary[0]) {
          y = this.getYPoint(fatRate, 0, 196, this.yBoundary[0], this.yBoundary[2]);
          this.blockNine.stroke++;
          total++;

        } else if (fatRate > this.yBoundary[0] && fatRate <= this.yBoundary[1]) {
          y = this.getYPoint(fatRate, this.yBoundary[0], 131, this.yBoundary[1] - this.yBoundary[0], this.yBoundary[2]);
          this.blockEight.stroke++;
          total++;

        } else {
          y = this.getYPoint(fatRate, this.yBoundary[1], 66, this.yBoundary[2] - this.yBoundary[1], this.yBoundary[2]);
          this.blockSeven.stroke++;
          total++;
        }

        this.points.push({
          x: this.getXPoint(FFMI, this.xBoundary[1], this.xBoundary[2], 324, this.xBoundary[2]),
          y: y
        });
      }

    }

    this.calPercentage(total);
  }

  /**
   * 根據y點比例對比圖表該區高度給予y軸落點(不貼邊)
   * @param y 
   * @param section 
   * @param yStart 
   * @param yScale 
   * @param yMax 
   * @returns {number}-y軸落點
   * @author kidin-1090131
   */
  getYPoint (y, section, yStart, yScale, yMax) {
    if (y / yMax > 1) {
      return 14;
    } else {
      return yStart - (((y - section) / yScale) * 52);
    }

  }

  /**
   * 根據x點比例對比圖表該區寬度給予x軸落點(不貼邊)
   * @param x 
   * @param min 
   * @param max 
   * @param xStart 
   * @param xMax 
   * @returns {number}-x軸落點
   * @author kidin-1090131
   */
  getXPoint (x, min, max, xStart, xMax) {
    if (x > xMax) {
      return 127 + xStart;
    } else {
      return ((x - min) / (max - min) * 127) + xStart;
    }
  }

  /**
   * 圖表文字上浮與否
   * @author kidin-1090317
   */
  floatChartText () {
    if (this.floatText === false) {
      this.floatText = true;
    } else {
      this.floatText = false;
    }
  }

  /**
   * 計算每個區塊的百分比
   * @param total 
   * @author kidin-1090324
   */
  calPercentage (total) {
    this.blockOne.percentage = `${((this.blockOne.stroke / total || 0) * 100).toFixed(0)}%`;
    this.blockTwo.percentage = `${((this.blockTwo.stroke / total || 0) * 100).toFixed(0)}%`;
    this.blockThree.percentage = `${((this.blockThree.stroke / total || 0) * 100).toFixed(0)}%`;
    this.blockFour.percentage = `${((this.blockFour.stroke / total || 0) * 100).toFixed(0)}%`;
    this.blockFive.percentage = `${((this.blockFive.stroke / total || 0) * 100).toFixed(0)}%`;
    this.blockSix.percentage = `${((this.blockSix.stroke / total || 0) * 100).toFixed(0)}%`;
    this.blockSeven.percentage = `${((this.blockSeven.stroke / total || 0) * 100).toFixed(0)}%`;
    this.blockEight.percentage = `${((this.blockEight.stroke / total || 0) * 100).toFixed(0)}%`;
    this.blockNine.percentage = `${((this.blockNine.stroke / total || 0) * 100).toFixed(0)}%`;
  }

  /**
   * 解決safari在使用linearGradient時，無法正常顯示的問題
   * @author kidin-1090428
   */
  fixSvgUrls () {
    const svgArr = document.querySelectorAll('#distributeChart [fill]');

    for (let i = 0; i < svgArr.length; i++) {
      const element = svgArr[i],
            maskId = element.getAttribute('fill').replace('url(', '').replace(')', '');
      element.setAttribute('fill', `url(${this.baseUrl + maskId})`);
    }

  }

}
