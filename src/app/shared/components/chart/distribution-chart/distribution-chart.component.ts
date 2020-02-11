import { Component, OnInit, Input } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-distribution-chart',
  templateUrl: './distribution-chart.component.html',
  styleUrls: ['./distribution-chart.component.scss']
})
export class DistributionChartComponent implements OnInit {
  @Input() perHrZoneData: Array<any>;
  @Input() selectType: string;  // 先預埋根據運動類型過濾落點-kidin-1090131

  points = [];  // 落點用變數-kidin-1090130
  blockOne = 0; // 需加強訓練強度-kidin-1090131
  blockTwo = 0; // 運動量與強度不足-kidin-1090131
  blockThree = 0; // 努力且確實的訓練-kidin-1090131
  blockFour = 0; // 良好穩定的訓練-kidin-1090131
  blockFive = 0; // 持續時間需要再加強-kidin-1090131
  blockSix = 0; // -kidin-1090131
  blockSeven = 0; // 容易造成負擔的訓練-kidin-1090131
  blockEight = 0; // 適度高強度的訓練-kidin-1090131
  blockNine = 0; // 短期爆發型的訓練-kidin-1090131

  constructor() { }

  ngOnInit() {
    this.initChart();
  }

  initChart () {
    for (let i = 0; i < this.perHrZoneData.length; i++) {
      if (this.perHrZoneData[i][0] === this.selectType || this.selectType === '99') {
        // sectionOne = z0 + z1 + z2 -kidin-1090130
        const sectionOne = this.perHrZoneData[i][1] + this.perHrZoneData[i][2] + this.perHrZoneData[i][3];
        // sectionOne = z2 + z3 + z4 -kidin-1090130
        const sectionTwo = this.perHrZoneData[i][3] + this.perHrZoneData[i][4] + this.perHrZoneData[i][5];
        // sectionOne = z4 + z5 -kidin-1090130
        const sectionThree = this.perHrZoneData[i][5] + this.perHrZoneData[i][6];

        // 根據x軸刻度進行分類，由左到右分三個區域依序為sectionOne sectionTwo sectionThree-kidin-1090131
        let y = 0;
        if (sectionThree >= sectionOne && sectionThree >= sectionTwo) {
          // 根據y軸刻度進行分類，由上到下分三個區域依序為小於20分鐘，大於20小於40分鐘，大於40分鐘-kidin-1090131
          if (sectionThree < 1200) {
            y = this.getYPoint(sectionThree, 1200, 196);
            this.blockNine++;
          } else if (sectionThree >= 1200 && sectionThree < 2400) {
            y = this.getYPoint(sectionThree, 2400, 131);
            this.blockEight++;
          } else {
            y = this.getYPoint(sectionThree, 3600, 66);
            this.blockSeven++;
          }

          this.points.push({
            x: this.getXPoint(this.perHrZoneData[i][5], this.perHrZoneData[i][6], null, 324),
            y: y
          });
        } else if (sectionTwo >= sectionOne) {
          if (sectionTwo < 1200) {
            y = this.getYPoint(sectionTwo, 1200, 196);
            this.blockSix++;
          } else if (sectionTwo >= 1200 && sectionTwo < 2400) {
            y = this.getYPoint(sectionTwo, 2400, 131);
            this.blockFive++;
          } else {
            y = this.getYPoint(sectionTwo, 3600, 66);
            this.blockFour++;
          }

          this.points.push({
            x: this.getXPoint(this.perHrZoneData[i][3], this.perHrZoneData[i][4], this.perHrZoneData[i][5], 184),
            y: y
          });

        } else {
          if (sectionOne < 1200) {
            y = this.getYPoint(sectionOne, 1200, 196);
            this.blockThree++;
          } else if (sectionOne >= 1200 && sectionOne < 2400) {
            y = this.getYPoint(sectionOne, 2400, 131);
            this.blockTwo++;
          } else {
            y = this.getYPoint(sectionOne, 3600, 66);
            this.blockOne++;
          }

          this.points.push({
            x: this.getXPoint(this.perHrZoneData[i][1], this.perHrZoneData[i][2], this.perHrZoneData[i][3], 44),
            y: y
          });

        }
      }
    }
  }

  // 推算時間比例對比圖表該區高度給予y軸落點(不貼邊)-kidin-1090131
  getYPoint (time, section, yStart) {
    // 運動超過1小時皆為圖表最高點-kidin-1090131
    if (section === 3600 && time / section > 1) {
      return 14;
    } else {
      return yStart - (time / section * 52);
    }
  }

  /* 推算心率比例對比圖表該區寬度給予x軸落點(不貼邊)
      （z0:z1:z2 = 1:2:3）
      （z2:z3:z4 = 1:2:3）
      （z4:z5 = 1:1） -kidin-1090131 */
  getXPoint (zoneA, zoneB, zoneC, xStart) {
    if (zoneC !== null) {
      return ((zoneA + zoneB * 2 + zoneC * 3) / ((zoneA + zoneB + zoneC) * 3) * 127 + xStart);
    } else if (zoneC === null) {
      return ((zoneA) / (zoneA + zoneB) * 127 + xStart);
    }
  }

}
