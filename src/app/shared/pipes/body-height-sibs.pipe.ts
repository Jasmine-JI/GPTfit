import { Pipe, PipeTransform } from '@angular/core';
import { UtilsService } from '../services/utils.service';
import { Unit } from '../models/bs-constant';

@Pipe({name: 'bodyHeightSibs'})
export class BodyHeightSibsPipe implements PipeTransform {

  constructor(
    private utils: UtilsService
  ) {}

  /**
   * 依公英制轉換身高單位。
   * @param value {number}-身高(cm)
   * @param args {[number, boolean]}-[公英制, 是否顯示單位]
   * @return {string}-長度單位
   * @author kidin-1100106
   */
  transform(value: number, args: [number, boolean]): string {
    const [unitType, showUnit] = [...args],
          result = this.utils.bodyHeightTransfer(value, unitType === Unit.imperial, true);
    let unitStr: string;
    if (unitType === Unit.imperial) {
      unitStr = 'inch';
    } else {
      unitStr = 'cm';
    }
    
    return showUnit || showUnit === undefined ? `${result} ${unitStr}` : `${result}`;
  }

}
