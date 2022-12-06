import { AnalysisOptionInfo } from '../models/report-analysis';
import { GroupLevel } from '../enum/professional';
import { SportType } from '../enum/sports';
import { AnalysisSportsColumn } from '../enum/report-analysis';
import { setLocalStorageObject, getLocalStorageObject } from '../../core/utils/index';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AnalysisOneOption } from './analysis-one-option';

/**
 * 用來辨認儲存於localStorage的項目是否符合目前版本
 * 版本號與GPTfit切開，群組報告重構則自行評估是否進版
 */
const storageVersion = '3';

export class AnalysisOption {
  optionInfo: AnalysisOptionInfo;

  /**
   * 顯示欄位篩選項目清單
   */
  itemList: Array<AnalysisOneOption> = [];

  /**
   * 最多可選擇項目
   */
  maxSelected = 5;

  /**
   * 最少可選擇項目
   */
  minSelected = 2;

  /**
   * 存於localStorage使用的key
   */
  storageKey: string;

  constructor(optionInfo: AnalysisOptionInfo) {
    this.optionInfo = optionInfo;
    this.createOptionList();
  }

  /**
   * 依使用者選擇之運動類別與群組階層，變更可選擇的選項
   * @param sportType {SportType}-運動類別
   * @param groupLevel {GroupLevel}-目前選擇的群組階層
   */
  changeOption(sportType: SportType, groupLevel: GroupLevel = undefined) {
    this.optionInfo.sportType = sportType;
    if (groupLevel) this.optionInfo.currentGroupLevel = groupLevel;
    this.createOptionList();
  }

  /**
   * 根據頁面與區塊，建立可選擇的選項清單
   */
  createOptionList() {
    of('')
      .pipe(
        tap(() => this.createOption()),
        tap(() => this.checkStorage()),
        tap(() => this.checkOverLimit()),
        tap(() => this.fillItem())
      )
      .subscribe();
  }

  /**
   * 建立選項
   */
  createOption() {}

  /**
   * 確認localStorage是否有儲存的設定
   */
  checkStorage() {
    const { storageKey } = this;
    const storage = getLocalStorageObject(storageKey);
    const { ver } = storage ?? '';
    if (this.checkStorageVersion(ver)) {
      return this.loadStorageOption(storage);
    }

    return this.setDefaultOption();
  }

  /**
   * 確認localStorage內儲存內容的版本，若為過往版本則不予使用
   * @param version {string}版本
   */
  checkStorageVersion(version: string) {
    return version === storageVersion;
  }

  /**
   * 載入已儲存於localStorage的設定
   * @param StorageOption {any}-儲存於localStorage的設定
   */
  loadStorageOption(StorageOption: any) {
    const { object } = this.optionInfo;
    const storage = StorageOption[object];
    if (storage) {
      storage.forEach((_item) => {
        const _itemValue = +_item;
        const index = this.itemList.findIndex((_list) => _list.info.item === _itemValue);
        if (index > -1) this.itemList[index].toggleSelected();
      });

      return;
    }

    return this.setDefaultOption();
  }

  /**
   * 設定預設選擇的項目
   */
  setDefaultOption() {
    const list = this.getDefaultOption();
    list.forEach((_list) => {
      const _itemValue = _list;
      const index = this.itemList.findIndex((_list) => _list.info.item === _itemValue);
      this.itemList[index].toggleSelected();
    });

    return this.saveOption();
  }

  /**
   * 取得預設選項
   */
  getDefaultOption() {
    return [];
  }

  /**
   * 確認已選擇的欄位項目是否超出極限值
   * @param width {number}-容器寬度
   */
  checkOverLimit(width: number = window.innerWidth) {
    this.checkSelectNumberLimit(width);
    const { maxSelected, minSelected } = this;
    let selectedNumber = 0;
    this.itemList = this.itemList.map((_list) => {
      const { selected } = _list;
      if (selected) selectedNumber++;

      // 若超出可選擇數目，由後往前開始取消選擇
      if (selectedNumber > maxSelected) _list.selected = false;
      return _list;
    });

    this.setCanSelectStatus(selectedNumber < maxSelected);
    this.setCanCancelStatus(selectedNumber > minSelected);
    return this.saveOption();
  }

  /**
   * 目前選擇欄位小於最大可選擇數目，則自動增加選擇的顯示欄位
   * （用於裝置頁面大小變更時)
   */
  fillItem() {
    let selectedNumber = this.getSelectedList().length;
    const { maxSelected } = this;
    if (selectedNumber < maxSelected) {
      this.itemList = this.itemList.map((_list) => {
        if (selectedNumber < maxSelected && !_list.selected) {
          _list.selected = true;
          selectedNumber++;
        }

        return _list;
      });
    }

    this.setCanSelectStatus(false);
    return this.saveOption();
  }

  /**
   * 確認視窗寬度以設定可選擇的項目數目
   * @param {number}-視窗寬度
   */
  checkSelectNumberLimit(width: number) {
    if (width < 500) {
      this.maxSelected = 1;
      this.minSelected = 0;
    } else if (width < 550) {
      this.maxSelected = 2;
      this.minSelected = 1;
    } else if (width < 680) {
      this.maxSelected = 3;
      this.minSelected = 1;
    } else if (width < 950) {
      this.maxSelected = 4;
      this.minSelected = 1;
    } else if (width < 1200) {
      this.maxSelected = 5;
      this.minSelected = 2;
    } else {
      this.maxSelected = 6;
      this.minSelected = 2;
    }
  }

  /**
   * 設定所有項目皆為可/不可選擇的項目
   * @param status {boolean}-是否可點擊的狀態
   */
  setCanSelectStatus(status: boolean) {
    this.itemList = this.itemList.map((_list) => {
      _list.canSelect = status;
      return _list;
    });
  }

  /**
   * 設定所有項目皆為可/不可取消的項目
   * @param status {boolean}-是否可點擊的狀態
   */
  setCanCancelStatus(status: boolean) {
    this.itemList = this.itemList.map((_list) => {
      _list.canCancel = status;
      return _list;
    });
  }

  /**
   * 依分析類別將分析欄位設定儲存於localStorage中
   */
  saveOption() {
    const {
      storageKey,
      optionInfo: { object },
    } = this;
    const selectedList = this.getSelectedList();
    const storage = getLocalStorageObject(storageKey);
    const { ver } = storage ?? '';
    const newOption = this.checkStorageVersion(ver)
      ? { ...storage, [object]: selectedList }
      : { [object]: selectedList, ver: storageVersion };

    setLocalStorageObject(storageKey, newOption);
    return;
  }

  /**
   * 取得已選擇的項目
   */
  getSelectedList() {
    return this.itemList.filter((_item) => _item.selected).map((_item) => _item.info.item);
  }

  /**
   * 是否選擇數目達到上限
   */
  itemSelectedFull() {
    return this.getSelectedList().length >= this.maxSelectedNumber;
  }

  /**
   * 取得特定欄位項目的選擇狀態
   */
  getItemSelectStatus(item: AnalysisSportsColumn) {
    const index = this.itemList.findIndex((_item) => _item.info.item === item);
    const assignItem = this.itemList[index];
    return assignItem ? assignItem.selected : false;
  }

  /**
   * 取得最多可選擇的數目
   */
  get maxSelectedNumber() {
    return this.maxSelected;
  }

  /**
   * 取得最少可選擇的數目
   */
  get minSelectedNumber() {
    return this.minSelected;
  }
}
