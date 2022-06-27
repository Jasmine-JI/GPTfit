/**
 * 處理單一選項選擇行為
 */
export class AnalysisOneOption {

  /**
   * 該選項資訊
   */
  private _info: any;

  /**
   * 是否選擇該選項
   */
  private _selected = false;

  /**
   * 是否可以選擇
   */
  private _canSelect = true;

  /**
   * 是否可以取消選擇
   */
  private _canCancel = true;


  constructor(info: any, selected: boolean = false) {
    this._info = info;
    this._selected = selected;
  }

  /**
   * 變更該項目可否選擇的狀態
   */
  set canSelect(can: boolean) {
    this._canSelect = can;
  }

  /**
   * 取得該項目可否選擇的狀態
   */
  get canSelect() {
    const { _selected, _canSelect, info } = this;
    return !_selected && _canSelect;
  }

  /**
   * 變更該項目可否取消的狀態
   */
  set canCancel(can: boolean) {
    this._canCancel = can;
  }

  /**
   * 取得該項目可否取消的狀態
   */
  get canCancel() {
    return this._selected && this._canCancel;
  }

  /**
   * 指定選擇狀態
   */
  set selected(select: boolean) {
    const { _canSelect, _canCancel } = this;
    const cancelApproved = !select && _canCancel;
    const selectApproved = select && _canSelect;
    if (cancelApproved) {
      this._selected = false;
    } else if (selectApproved) {
      this._selected = true;
    }

  }

  /**
   * 取得選擇狀態
   */
  get selected() {
    return this._selected;
  }

  /**
   * 確認是否可變更選擇狀態，再進行變更
   */
  toggleSelected() {
    this.selected = !this.selected;
  }

  /**
   * 取得該選項資訊
   */
  get info() {
    return this._info;
  }

}