import { mathRounding } from '../utils';

export interface RatioOption {
  updateValue?: boolean; // 是否將_previousValue以currentValue進行覆寫
  decimal?: number; // 四捨五入位數
}

/**
 * 用來計算兩個數據之間的增長
 */
export class IncreaseRatio {
  private _previousValue = 0;

  /**
   * 更新前一個數據數值
   */
  set previousValue(value: number) {
    this._previousValue = value;
  }

  /**
   * 取得增長率，以及更新前一個數據數值
   * @param option {number}-取值的設定
   */
  getRatio(currentValue: number, option?: RatioOption) {
    const { _previousValue } = this;
    const { updateValue, decimal } = {
      updateValue: true,
      decimal: 1,
      ...option,
    };

    const invalidPreviousValue = !_previousValue || _previousValue <= 0;
    const result = invalidPreviousValue
      ? '-'
      : mathRounding((((currentValue ?? 0) - _previousValue) / _previousValue) * 100, decimal);

    if (updateValue) this._previousValue = currentValue ?? 0;
    return result;
  }
}
