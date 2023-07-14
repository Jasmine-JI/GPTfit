import { Pipe, PipeTransform } from '@angular/core';
import { speedToPace } from '../utils/sports';
import { DataUnitType } from '../enums/common';
import { SportType } from '../enums/sports';
import { paceReg } from '../models/regex';

@Pipe({
  name: 'sportPaceSibs',
  standalone: true,
})
export class SportPaceSibsPipe implements PipeTransform {
  /**
   * 根據運動類型將速度轉成配速(若為bs英制則公里配速轉英哩配速)
   * @param value 速度
   * @param args {{ sportType: SportType; userUnit: DataUnitType; showUnit: boolean; }}-{運動類別, 公英制, 是否顯示單位}
   */
  transform(
    value: number | string,
    args = { sportType: SportType.all, userUnit: DataUnitType.metric, showUnit: false }
  ): string | number {
    if (paceReg.test(value as string)) return value;
    const { sportType, userUnit, showUnit } = args;
    const { value: pace, unit: paceUnit } = speedToPace(value, sportType, userUnit);
    return showUnit ? `${pace} ${paceUnit}` : pace;
  }
}
