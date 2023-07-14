import { Component, OnChanges, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { QuadrantSetting, QuadrantNum } from '../../../../../core/models/compo';
import { quadrantColor } from '../../../../../core/models/represent-color';
import { mathRounding } from '../../../../../core/utils';
import { SportPaceSibsPipe, DataTypeTranslatePipe } from '../../../../../core/pipes';
import { SportType } from '../../../../../core/enums/sports';
import { UserService } from '../../../../../core/services';

@Component({
  selector: 'app-quadrant-info',
  standalone: true,
  imports: [CommonModule, TranslateModule, SportPaceSibsPipe, DataTypeTranslatePipe],
  templateUrl: './quadrant-info.component.html',
  styleUrls: ['./quadrant-info.component.scss'],
})
export class QuadrantInfoComponent implements OnChanges {
  /**
   * 象限圖設定
   */
  @Input() setting: QuadrantSetting;

  /**
   * 各象限數據數目
   */
  @Input() quadrantNum: QuadrantNum;

  /**
   * 運動類別
   */
  @Input() sportsType: SportType;

  /**
   * 是否為基準檔案
   */
  @Input() isBaseFile = true;

  /**
   * 各象限數據數量佔比
   */
  percentage = {
    i: 0,
    ii: 0,
    iii: 0,
    iv: 0,
  };

  readonly quadrantColor = quadrantColor;
  readonly SportType = SportType;

  constructor(private userService: UserService) {}

  /**
   * 取得使用者使用公英制
   */
  get unit() {
    return this.userService.getUser().unit;
  }

  ngOnChanges(e: SimpleChanges) {
    const { quadrantNum } = e;
    if (quadrantNum) this.countPercentage();
  }

  /**
   * 計算各象限數據數量佔比
   */
  countPercentage() {
    const {
      quadrantNum: { i, ii, iii, iv },
    } = this;
    const total = i + ii + iii + iv;
    const getPercentage = (val: number) => {
      return mathRounding((val / total) * 100, 1);
    };
    this.percentage = {
      i: getPercentage(i),
      ii: getPercentage(ii),
      iii: getPercentage(iii),
      iv: getPercentage(iv),
    };
  }
}
