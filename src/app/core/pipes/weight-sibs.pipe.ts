import { Pipe, PipeTransform } from '@angular/core';
import { lb } from '../models/const/bs-constant.model';
import { DataUnitType } from '../enums/common';
import { DataUnitOption } from '../models/common';

@Pipe({
  name: 'weightSibs',
  standalone: true,
})
export class WeightSibsPipe implements PipeTransform {
  /**
   * 依公英制轉換重量單位。
   * @param value 重量
   * @param args.unitType 單位類別(公英制)
   * @param args.showUnit 是否顯示單位
   */
  transform(value: number, args: DataUnitOption): string {
    const { unitType, showUnit } = args;
    const isMetric = unitType === undefined || unitType === DataUnitType.metric;
    const finalValue = isMetric ? value || 0 : +(value / lb) || 0;
    const unit = isMetric ? 'kg' : 'lb';
    const fixedValue = parseFloat(finalValue.toFixed(0));
    return showUnit ?? true ? `${fixedValue} ${unit}` : `${fixedValue}`;
  }
}
