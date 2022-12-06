import { Pipe, PipeTransform } from '@angular/core';
import { ft, inch } from '../models/bs-constant';
import { Unit } from '../enum/value-conversion';
import { mathRounding } from '../../core/utils/index';

type MetricLenUnit = 'cm' | 'mm';
type ImperialLenUnit = 'ft' | 'inch';

interface Option {
  userUnit: Unit; // 公制或英制
  showUnit?: boolean; // 是否顯示單位
  valueUnit: MetricLenUnit; // 被轉換的單位
  transformUnit: ImperialLenUnit; // 欲轉換的單位
  digit?: number; // 四捨五入位數
}

/**
 * 將公制長度轉為英制
 * @author kidin-1100824
 */
@Pipe({ name: 'lengthSibs' })
export class LengthSibsPipe implements PipeTransform {
  /**
   * 依公英制轉換長度單位。
   * @param value {number}-長度
   * @param args {Option}-其他所需資訊或選項
   * @return {string}-長度單位
   * @author kidin-1100824
   */
  transform(value: number, args: Option): string {
    const { userUnit, showUnit, valueUnit, transformUnit, digit } = args;

    let finalValue: number, dispUnit: MetricLenUnit | ImperialLenUnit;
    const isMetric = userUnit === Unit.metric,
      isCentiMeter = valueUnit === 'cm';
    if (isMetric) {
      finalValue = value;
      dispUnit = valueUnit;
    } else {
      dispUnit = transformUnit;
      switch (transformUnit) {
        case 'ft':
          finalValue = isCentiMeter ? value / ft : value / 10 / ft;
          break;
        case 'inch':
          finalValue = isCentiMeter ? value / inch : value / 10 / inch;
          break;
      }
    }

    const roundValue = mathRounding(finalValue, digit ?? 2);
    return showUnit ? `${roundValue} ${dispUnit}` : `${roundValue}`;
  }
}
