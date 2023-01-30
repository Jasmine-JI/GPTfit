import { mathRounding } from '../utils';
import { IntegrationType } from '../enums/common';

export class DataIntegration {
  private _type = IntegrationType.totalData;
  private _dataMark = new Set();
  private _totalValue = 0;
  private _counts = 0;

  constructor(type: IntegrationType) {
    this._type = type;
  }

  /**
   * 根據數據類型判斷值後再相加
   * @param data {number}-欲相加的數據
   * @param args {{ count: number; mark?: string | number }}-參數
   */
  addNewData(data: number, args?: { count?: number; mark?: string | number }) {
    const value = data ?? 0;
    const count = args?.count || 1;
    switch (this._type) {
      case IntegrationType.effectAvgData:
        if (value > 0) this.addData(value, count);
        break;
      case IntegrationType.noRepeatTotalData:
      case IntegrationType.noRepeatAvgData: {
        const { mark } = args;
        if (!this._dataMark.has(mark)) {
          this._dataMark.add(mark);
          this.addData(value, count);
        }
        break;
      }
      case IntegrationType.noRepeatEffectAvgData: {
        const { mark } = args;
        if (!this._dataMark.has(mark) && value > 0) {
          this._dataMark.add(mark);
          this.addData(value, count);
        }
        break;
      }
      default:
        this.addData(value, count);
        break;
    }
  }

  /**
   * 數據相加
   * @param data {number}-欲相加的數據
   * @param count {number}-此數據涵蓋筆數
   */
  private addData(data: number, count = 1) {
    this._totalValue += data;
    this._counts += count;
  }

  /**
   * 取得最後計算結果
   * @param decimal {number}-四捨五入位數
   */
  getResult(decimal = 1) {
    let finalValue = 0;
    const { _type, _totalValue, _counts } = this;
    switch (_type) {
      case IntegrationType.avgData:
      case IntegrationType.effectAvgData:
      case IntegrationType.noRepeatAvgData:
      case IntegrationType.noRepeatEffectAvgData:
        finalValue = mathRounding(_totalValue / (_counts || Infinity), decimal);
        break;
      default:
        finalValue = mathRounding(this._totalValue, decimal);
        break;
    }

    return { value: finalValue, counts: this._counts };
  }
}
