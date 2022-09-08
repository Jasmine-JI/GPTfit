import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AnalysisOneOption } from './analysis-one-option';

/**
 * 報告內分析項目可設定的選項
 */
export class AnalysisOption {
  /**
   * 顯示欄位篩選項目清單
   */
  private _itemList: Array<AnalysisOneOption> = [];

  /**
   * 最多可選擇項目
   */
  private _maxSelected = 5;

  /**
   * 最少可選擇項目
   */
  private _minSelected = 2;

  constructor(columnList: Array<any>, defaultList: Array<any>) {
    this.createOptionList(columnList, defaultList);
  }

  /**
   * 根據頁面與區塊，建立可選擇的選項清單
   * @param columnList {Array<any>}-欄位清單
   * @param defaultList {Array<any>}-預設顯示欄位
   */
  createOptionList(columnList: Array<any>, defaultList: Array<any>) {
    of(columnList)
      .pipe(
        tap((list) => this.createOption(list)),
        tap(() => this.setDefaultOption(defaultList)),
        tap(() => this.checkOverLimit()),
        tap(() => this.fillItem())
      )
      .subscribe();
  }

  /**
   * 建立分析可選擇的欄位選項清單
   * @param list {Array<any>}-可篩選之欄位清單
   */
  createOption(list: Array<any>) {
    this._itemList = list
      .sort((a, b) => a - b)
      .map((_item) => new AnalysisOneOption({ item: _item }));
    return;
  }

  /**
   * 設定預設選擇的項目
   * @param defaultList {Array<any>}-預設顯示的欄位清單
   */
  setDefaultOption(defaultList: Array<any>) {
    defaultList.forEach((_list) => {
      const _itemValue = _list;
      const index = this._itemList.findIndex((_list) => _list.info.item === _itemValue);
      this._itemList[index].toggleSelected();
    });

    return;
  }

  /**
   * 確認已選擇的欄位項目是否超出極限值
   * @param width {number}-容器寬度
   */
  checkOverLimit(width: number = window.innerWidth) {
    this.checkSelectNumberLimit(width);
    const { _maxSelected, _minSelected } = this;
    let selectedNumber = 0;
    this._itemList = this._itemList.map((_list) => {
      const { selected } = _list;
      if (selected) selectedNumber++;

      // 若超出可選擇數目，由後往前開始取消選擇
      if (selectedNumber > _maxSelected) _list.selected = false;
      return _list;
    });

    this.setCanSelectStatus(selectedNumber < _maxSelected);
    this.setCanCancelStatus(selectedNumber > _minSelected);
    return;
  }

  /**
   * 目前選擇欄位小於最大可選擇數目，則自動增加選擇的顯示欄位
   * （用於裝置頁面大小變更時)
   */
  fillItem() {
    let selectedNumber = this.getSelectedList().length;
    const { _maxSelected } = this;
    if (selectedNumber < _maxSelected) {
      this._itemList = this._itemList.map((_list) => {
        if (selectedNumber < _maxSelected && !_list.selected) {
          _list.selected = true;
          selectedNumber++;
        }

        return _list;
      });
    }

    this.setCanSelectStatus(false);
    return;
  }

  /**
   * 確認視窗寬度以設定可選擇的項目數目
   * @param {number}-視窗寬度
   */
  checkSelectNumberLimit(width: number) {
    if (width < 500) {
      this._maxSelected = 1;
      this._minSelected = 0;
    } else if (width < 550) {
      this._maxSelected = 2;
      this._minSelected = 1;
    } else if (width < 680) {
      this._maxSelected = 3;
      this._minSelected = 1;
    } else if (width < 950) {
      this._maxSelected = 4;
      this._minSelected = 1;
    } else if (width < 1200) {
      this._maxSelected = 5;
      this._minSelected = 2;
    } else {
      this._maxSelected = 6;
      this._minSelected = 2;
    }
  }

  /**
   * 設定所有項目皆為可/不可選擇的項目
   * @param status {boolean}-是否可點擊的狀態
   */
  setCanSelectStatus(status: boolean) {
    this._itemList = this._itemList.map((_list) => {
      _list.canSelect = status;
      return _list;
    });
  }

  /**
   * 設定所有項目皆為可/不可取消的項目
   * @param status {boolean}-是否可點擊的狀態
   */
  setCanCancelStatus(status: boolean) {
    this._itemList = this._itemList.map((_list) => {
      _list.canCancel = status;
      return _list;
    });
  }

  /**
   * 取得已選擇的項目
   */
  getSelectedList() {
    return this._itemList.filter((_item) => _item.selected).map((_item) => _item.info.item);
  }

  /**
   * 是否選擇數目達到上限
   */
  itemSelectedFull() {
    return this.getSelectedList().length >= this.maxSelectedNumber;
  }

  /**
   * 取得欄位項目清單
   */
  get itemList() {
    return this._itemList;
  }

  /**
   * 取得特定欄位項目的選擇狀態
   * @param item {string}-重訓動作分析欄位
   */
  getItemSelectStatus(item: string) {
    const index = this._itemList.findIndex((_item) => _item.info.item === item);
    const assignItem = this._itemList[index];
    return assignItem ? assignItem.selected : false;
  }

  /**
   * 取得最多可選擇的數目
   */
  get maxSelectedNumber() {
    return this._maxSelected;
  }

  /**
   * 取得最少可選擇的數目
   */
  get minSelectedNumber() {
    return this._minSelected;
  }
}
