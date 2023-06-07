import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-body-constitute-svg',
  templateUrl: './body-constitute-svg.component.html',
  styleUrls: ['./body-constitute-svg.component.scss'],
  standalone: true,
  imports: [DecimalPipe, TranslateModule],
})
export class BodyConstituteSvgComponent implements OnInit, OnChanges {
  maskYPoint = {
    muscleYMax: 632,
    fatRateYMax: 632,
  };

  info = {
    muscleWeight: 0,
    muscleInfoY: 450,
    fatWeight: 0,
    fatInfoY: 250,
    comment: this.translate.instant('universal_status_noData'),
    commentY: 70,
  };

  baseUrl = window.location.href;
  textXOffset = 0;

  @Input() fatRate: number;
  @Input() muscleRate: number;
  @Input() bodyWeight: number;
  @Input() FFMI: number;
  @Input() gender: number;

  constructor(private translate: TranslateService) {}

  ngOnInit() {
    this.fixSvgUrls();
  }

  ngOnChanges() {
    this.initVar();

    if (this.fatRate && this.bodyWeight && this.muscleRate) {
      this.setMaskRegion();
      this.setComment();
    }
  }

  /**
   * 初始化變數
   * @author kidin
   */
  initVar() {
    this.maskYPoint = {
      muscleYMax: 632,
      fatRateYMax: 632,
    };

    this.info = {
      muscleWeight: 0,
      muscleInfoY: 450,
      fatWeight: 0,
      fatInfoY: 250,
      comment: this.translate.instant('universal_status_noData'),
      commentY: 70,
    };
  }

  // 依據肌肉率和體脂率設定遮罩範圍(高度)-kidin-1090226
  setMaskRegion() {
    this.maskYPoint.muscleYMax = 632 - (632 * this.muscleRate) / 100;
    this.maskYPoint.fatRateYMax = this.maskYPoint.muscleYMax - (632 * this.fatRate) / 100;

    this.info.muscleInfoY = (632 + this.maskYPoint.muscleYMax) / 2 - 55;
    this.info.fatInfoY = (this.maskYPoint.muscleYMax + this.maskYPoint.fatRateYMax) / 2 - 50;
    this.info.commentY = this.maskYPoint.fatRateYMax / 2 - 50;
  }

  // 依據FFMI和體脂率給予身體素質評語-kidin-1090226
  setComment() {
    this.info.muscleWeight = (this.bodyWeight * this.muscleRate) / 100;
    this.info.fatWeight = (this.bodyWeight * this.fatRate) / 100;

    let FFMIBoundary = [],
      fatRateBoundary = [];
    if (this.gender === 0) {
      FFMIBoundary = [17, 22];
      fatRateBoundary = [17, 22];
    } else {
      FFMIBoundary = [14, 19];
      fatRateBoundary = [23, 27];
    }

    if (this.FFMI < FFMIBoundary[0]) {
      if (this.fatRate < fatRateBoundary[0]) {
        this.info.comment = this.translate.instant('universal_activityData_tooThin');
      } else if (this.fatRate < fatRateBoundary[1] && this.fatRate >= fatRateBoundary[0]) {
        this.info.comment = this.translate.instant('universal_activityData_lackOfTraining');
      } else {
        this.info.comment = this.translate.instant('universal_activityData_recessiveObesity');
      }
    } else if (this.FFMI < FFMIBoundary[1] && this.FFMI >= FFMIBoundary[0]) {
      if (this.fatRate < fatRateBoundary[0]) {
        this.info.comment = this.translate.instant('universal_activityData_generallyThin');
      } else if (this.fatRate < fatRateBoundary[1] && this.fatRate >= fatRateBoundary[0]) {
        this.info.comment = this.translate.instant('universal_activityData_normalPosture');
      } else {
        this.info.comment = this.translate.instant('universal_activityData_generallyFat');
      }
    } else {
      if (this.fatRate < fatRateBoundary[0]) {
        this.info.comment = this.translate.instant('universal_activityData_bodybuilding');
      } else if (this.fatRate < fatRateBoundary[1] && this.fatRate >= fatRateBoundary[0]) {
        this.info.comment = this.translate.instant('universal_activityData_athletic');
      } else {
        this.info.comment = this.translate.instant('universal_activityData_fatBody');
      }
    }
  }

  // 解決safari在使用mask時，無法正常顯示的問題-kidin-1090428
  fixSvgUrls() {
    const svgArr = document.querySelectorAll('#bodyConstituteChart [mask]');

    for (let i = 0; i < svgArr.length; i++) {
      const element = svgArr[i],
        maskId = element.getAttribute('mask').replace('url(', '').replace(')', '');
      element.setAttribute('mask', `url(${this.baseUrl + maskId})`);
    }
  }
}
