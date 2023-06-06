import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ActivityInfo } from '../../../../../core/models/api/api-21xx';
import {
  SportTimePipe,
  DistanceSibsPipe,
  SportPaceSibsPipe,
  SpeedPaceUnitPipe,
  SpeedSibsPipe,
  WeightSibsPipe,
} from '../../../../../core/pipes';
import { SportType } from '../../../../../core/enums/sports';
import { DataUnitType } from '../../../../../core/enums/common';
import { UserService } from '../../../../../core/services';
import { mathRounding } from '../../../../../core/utils';

@Component({
  selector: 'app-info-data-image',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    SportTimePipe,
    DistanceSibsPipe,
    SportPaceSibsPipe,
    SpeedPaceUnitPipe,
    SpeedSibsPipe,
    WeightSibsPipe,
  ],
  templateUrl: './info-data-image.component.html',
  styleUrls: ['./info-data-image.component.scss'],
})
export class InfoDataImageComponent {
  /**
   * 運動檔案代表圖
   */
  @Input() imagePath: string;

  /**
   * 運動檔案概要資訊
   */
  @Input() activityInfo: ActivityInfo;

  /**
   * 使用者使用單位
   */
  userUnit = this.userService.getUser().unit;

  readonly SportType = SportType;

  readonly DataUnitType = DataUnitType;

  constructor(private userService: UserService) {}

  /**
   * 包含或排除部份運動類別
   * @param typeList 欲包含的運動類別
   */
  includeSportsType(typeList: Array<SportType>) {
    const type = +this.activityInfo.type;
    return typeList.includes(type);
  }

  /**
   * 包含或排除部份運動類別
   * @param typeList 欲排除的運動類別
   */
  excludeSportsType(typeList: Array<SportType>) {
    return !this.includeSportsType(typeList);
  }

  /**
   * 取得卡路里數據，超過千卡以千卡顯示
   */
  getCalories() {
    const calories = this.activityInfo?.calories ?? 0;
    let value = calories;
    let unit = 'cal';
    if (calories > 1000) {
      value = mathRounding(calories / 1000, 2);
      unit = 'kcal';
    }

    return {
      title: 'universal_activityData_totalCalories',
      value,
      unit,
    };
  }
}
