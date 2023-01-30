import { Pipe, PipeTransform } from '@angular/core';
import { bodyHeightTransfer, mathRounding } from '../utils';
import { DataUnitType } from '../enums/common';

@Pipe({
  name: 'bodyHeightSibs',
  standalone: true,
})
export class BodyHeightSibsPipe implements PipeTransform {
  constructor() {}

  /**
   * 依公英制轉換身高單位。
   * @param value {number}-身高(cm)
   * @param args {[number, boolean]}-[公英制, 是否顯示單位]
   * @return {string}-長度單位
   */
  transform(value: number, args: [number, boolean]): string {
    const [unitType, showUnit] = [...args];
    const result = bodyHeightTransfer(value, unitType === DataUnitType.imperial, true);
    const bodyHeight = typeof result === 'number' ? mathRounding(result as number, 1) : result;
    let unitStr: string;
    if (unitType === DataUnitType.imperial) {
      unitStr = 'inch';
    } else {
      unitStr = 'cm';
    }

    return showUnit || showUnit === undefined ? `${bodyHeight} ${unitStr}` : `${bodyHeight}`;
  }
}
