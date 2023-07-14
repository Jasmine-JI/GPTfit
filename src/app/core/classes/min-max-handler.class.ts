/**
 * 用來處理取得最大與最小值
 */
export class MinMaxHandler {
  private _min: number | null = null;
  private _max: number | null = null;

  constructor(val?: number) {
    if (val != null) this.setMinMax(val);
  }

  /**
   * 儲存最小值
   */
  set min(val: number | null) {
    if (val === null) return;

    const { _min } = this;
    if (_min === null || val < _min) this._min = val;
  }

  /**
   * 取得最小值
   */
  get min() {
    return this._min;
  }

  /**
   * 儲存最大值
   */
  set max(val: number | null) {
    if (val === null) return;

    const { _max } = this;
    if (_max === null || val > _max) this._max = val;
  }

  /**
   * 取得最小值
   */
  get max() {
    return this._max;
  }

  /**
   * 取得最大最小值的差
   */
  get minMaxDiff() {
    return (this._max ?? 0) - (this._min ?? 0);
  }

  /**
   * 同時判斷是否為最大最小值
   */
  setMinMax(val: number | null) {
    if (val === null) return;
    this.max = val;
    this.min = val;
  }

  /**
   * 取得最大最小值
   */
  get minMax() {
    const { _min, _max } = this;
    return { min: _min, max: _max };
  }
}
