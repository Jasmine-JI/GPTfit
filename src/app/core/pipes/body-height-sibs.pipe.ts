import { Pipe, PipeTransform } from '@angular/core';
import { bodyHeightTransfer, mathRounding } from '../utils';
import { DataUnitType } from '../enums/common';
import { DataUnitOption } from '../models/common';

@Pipe({
  name: 'bodyHeightSibs',
  standalone: true,
})
export class BodyHeightSibsPipe implements PipeTransform {
  constructor() {}

  /**
   * 依公英制轉換身高單位。
   * @param value {number}-身高(cm)
   * @param args.unitType 單位類別(公英制)
   * @param args.showUnit 是否顯示單位
   */
  transform(value: number, args: DataUnitOption): string {
    const { unitType, showUnit } = args;
    const isImperial = unitType === DataUnitType.imperial;
    const result = bodyHeightTransfer(value, isImperial, true);
    const bodyHeight = typeof result === 'number' ? mathRounding(result as number, 1) : result;
    const unitStr = isImperial ? 'inch' : 'cm';
    return showUnit ?? true ? `${bodyHeight} ${unitStr}` : `${bodyHeight}`;
  }
}
