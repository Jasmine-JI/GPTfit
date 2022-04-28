import { countPercentage } from '../utils/index';

/**
 * 用來計算百分比
 */
export class Percentage {

  /**
   * 記數陣列
   */
  _stroke: Array<number>;

  constructor(dataLength: number = 9) {
    this._stroke = new Array(dataLength).fill(0);
  }

  /**
   * 將陣列初始化
   */
  init() {
    this._stroke = this._stroke.map(() => 0);
  }

  /**
   * 針對指定數據增加記數
   * @param index {number}-指定之數據位置
   */
  count(index: number) {
    this._stroke[index]++;
  }

  /**
   * 取得指定數據的百分比
   * @param index {number}-指定之數據位置
   */
  getAssignPercentage(index: number) {
    const totalValue = this._stroke.reduce((prev, current) => prev + current);
    return countPercentage(this._stroke[index], totalValue);
  }

  /**
   * 取得全部百分比數據
   */
  getAllPercentage() {
    const totalValue = this._stroke.reduce((prev, current) => prev + current);
    return this._stroke.map(_value => countPercentage(_value, totalValue))
  }

}