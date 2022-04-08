import { AnalysisOptionInfo, AnalysisObject } from '../models/report-analysis';
import { GroupLevel } from '../../../shared/enum/professional';
import { SportType } from '../../../shared/enum/sports';
import { AnalysisSportsColumn } from '../enum/report-analysis';
import { setLocalStorageObject, getLocalStorageObject } from '../../../shared/utils/index';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * 用來辨認儲存於localStorage的項目是否符合目前版本
 * 版本號與GPTfit切開，群組報告重構則自行評估是否進版
 */
const storageVersion = '2';

/**
 * 報告內分析項目可設定的選項
 */
export class AnalysisOption {

  private _optionInfo: AnalysisOptionInfo;

  /**
   * 群組篩選項目清單
   */
  private _layerList = [];

  /**
   * 顯示欄位篩選項目清單
   */
  private _itemList: Array<OneOption> = [];

  /**
   * 最多可選擇項目
   */
  private _maxSelected = 5;

  /**
   * 最少可選擇項目
   */
  private _minSelected = 2;

  /**
   * 存於localStorage使用的key
   */
  private _storageKey: string;

  constructor(optionInfo: AnalysisOptionInfo) {
    this._optionInfo = optionInfo;
    this.createOptionList(optionInfo);
  }

  /**
   * 依使用者選擇之運動類別與群組階層，變更可選擇的選項
   * @param sportType {SportType}-運動類別
   * @param groupLevel {GroupLevel}-目前選擇的群組階層
   */
  changeOption(sportType: SportType, groupLevel: GroupLevel) {
    this._optionInfo.sportType = sportType;
    this._optionInfo.currentGroupLevel = groupLevel;
    this.createOptionList(this._optionInfo);
  }

  /**
   * 根據頁面與區塊，建立可選擇的選項清單
   * @param info {AnalysisOptionInfo}-建立選項所需資訊
   */
  createOptionList(info: AnalysisOptionInfo) {
    const { reportType, currentGroupLevel, object } = info;
    of(currentGroupLevel).pipe(
      tap(level => this.handleGroupOption(level)),
      tap(() => {
        switch (reportType) {
          case 'sports':
            if (object === 'group') return this.createGroupSportOption()
            return this.createPersonalSportOption();
          case 'lifeTracking':
          case 'cloudrun':
            // 待該群組報告重構
            return '';
        }

      }),
      tap(() => this.checkStorage()),
      tap(() => this.checkOverLimit()),
      tap(() => this.fillItem())
    ).subscribe();

  }

  /**
   * 建立可選擇的群組選項清單
   * @param level {GroupLevel}-群組階層
   */
  handleGroupOption(level: GroupLevel) {
    this._layerList = [];
    if (level <= GroupLevel.branch) {
      this._layerList.unshift(new OneOption({ level: GroupLevel.class }, true));
      this._layerList.unshift(new OneOption({ level: GroupLevel.branch }, true));
    }

    if (level <= GroupLevel.brand) {
      this._layerList.unshift(new OneOption({ level: GroupLevel.brand }, true));
    }

    return;
  }

  /**
   * 取得階層清單
   */
  get layerList() {
    return this._layerList;
  }

  /**
   * 建立運動報告團體分析可選擇的欄位選項清單
   */
  createGroupSportOption() {
    const { sportType } = this._optionInfo;
    let list = [
      AnalysisSportsColumn.targetAchievedRate,
      AnalysisSportsColumn.activityPeople,
      AnalysisSportsColumn.activities,
      AnalysisSportsColumn.totalSecond,
      AnalysisSportsColumn.calories,
      AnalysisSportsColumn.averageHeartRate,
      AnalysisSportsColumn.hrChart
    ];

    switch (sportType) {
      case SportType.all:
        list = list.concat([
          AnalysisSportsColumn.benefitTime,
          AnalysisSportsColumn.pai
        ]);
        break;
      case SportType.run:
      case SportType.swim:
        list = list.concat([
          AnalysisSportsColumn.distance,
          AnalysisSportsColumn.speedOrPace,
          AnalysisSportsColumn.cadence
        ]);
        break;
      case SportType.cycle:
      case SportType.row:
        list = list.concat([
          AnalysisSportsColumn.distance,
          AnalysisSportsColumn.speedOrPace,
          AnalysisSportsColumn.cadence,
          AnalysisSportsColumn.power
        ]);
        break;
      case SportType.weightTrain:
        list = list.concat([
          AnalysisSportsColumn.totalActivitySecond
        ]);
        break;
      case SportType.ball:
        list = list.concat([
          AnalysisSportsColumn.distance
        ]);
        break;
    }

    this._itemList = list.sort((a, b) => a - b)
      .map(_item => new OneOption({ item: _item }));
    
    this._storageKey = `groupReport-${sportType}`;
    return;
  }

  /**
   * 建立運動報告個人分析可選擇的欄位選項清單
   */
  createPersonalSportOption() {
    const { sportType } = this._optionInfo;
    let list = [
      AnalysisSportsColumn.activities,
      AnalysisSportsColumn.totalSecond,
      AnalysisSportsColumn.calories,
      AnalysisSportsColumn.averageHeartRate,
      AnalysisSportsColumn.preferSports,
      AnalysisSportsColumn.hrChart
    ];

    switch (sportType) {
      case SportType.all:
        list = list.concat([
          AnalysisSportsColumn.benefitTime,
          AnalysisSportsColumn.pai
        ]);
        break;
      case SportType.run:
      case SportType.swim:
        list = list.concat([
          AnalysisSportsColumn.distance,
          AnalysisSportsColumn.speedOrPace,
          AnalysisSportsColumn.cadence
        ]);
        break;
      case SportType.cycle:
      case SportType.row:
        list = list.concat([
          AnalysisSportsColumn.distance,
          AnalysisSportsColumn.speedOrPace,
          AnalysisSportsColumn.cadence,
          AnalysisSportsColumn.power
        ]);
        break;
      case SportType.weightTrain:
        list = list.concat([
          AnalysisSportsColumn.totalActivitySecond,
          AnalysisSportsColumn.preferMuscle,
          AnalysisSportsColumn.armMuscle,
          AnalysisSportsColumn.pectoralsMuscle,
          AnalysisSportsColumn.shoulderMuscle,
          AnalysisSportsColumn.backMuscle,
          AnalysisSportsColumn.abdominalMuscle,
          AnalysisSportsColumn.legMuscle
        ]);
        break;
      case SportType.ball:
        list = list.concat([
          AnalysisSportsColumn.distance
        ]);
        break;
    }

    this._itemList = list.sort((a, b) => a - b)
      .map(_item => new OneOption({ item: _item }));
    
    this._storageKey = `groupReport-${sportType}`;
    return;
  }

  /**
   * 確認localStorage是否有儲存的設定
   */
  checkStorage() {
    const { _storageKey } = this;
    const storage = getLocalStorageObject(_storageKey);
    const { ver } = storage ?? '';
    if (this.checkStorageVersion(ver)) {
      this.loadStorageOption(storage);
      return _storageKey;
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
    const { object } = this._optionInfo;
    const storage = StorageOption[object];
    if (storage) {
      storage.forEach(_item => {
        const _itemValue = +_item;
        const index = this._itemList.findIndex(_list => _list.info.item === _itemValue);
        if (index > -1) this._itemList[index].toggleSelected();
      });

    }

    return;
  }

  /**
   * 設定預設選擇的項目
   */
  setDefaultOption() {
    const { reportType, object } = this._optionInfo;
    let list = [];
    switch (reportType) {
      case 'sports':
        const groupColumn = [
          AnalysisSportsColumn.targetAchievedRate,
          AnalysisSportsColumn.activityPeople,
          AnalysisSportsColumn.activities,
          AnalysisSportsColumn.totalSecond,
          AnalysisSportsColumn.hrChart
        ];

        const personColumn = [
          AnalysisSportsColumn.activities,
          AnalysisSportsColumn.totalSecond,
          AnalysisSportsColumn.calories,
          AnalysisSportsColumn.averageHeartRate,
          AnalysisSportsColumn.hrChart
        ];

        list = object === 'group' ? groupColumn : personColumn;
        break;
      case 'lifeTracking':
      case 'cloudrun':
        break;
    }

    list.forEach(_list => {
      const _itemValue = _list;
      const index = this._itemList.findIndex(_list => _list.info.item === _itemValue);
      this._itemList[index].toggleSelected();
    });
    
    return this.saveOption();
  }

  /**
   * 確認已選擇的欄位項目是否超出極限值
   */
  checkOverLimit() {
    this.checkSelectNumberLimit(window.innerWidth);
    const { _maxSelected, _minSelected } = this;
    let selectedNumber = 0;
    this._itemList = this._itemList.map(_list => {
      const { selected } = _list;
      if (selected) selectedNumber++;

      // 若超出可選擇數目，由後往前開始取消選擇
      if (selectedNumber > _maxSelected) _list.selected = false;
      return _list;
    });

    this.setCanSelectStatus(selectedNumber < _maxSelected);
    this.setCanCancelStatus(selectedNumber > _minSelected);
    return this.saveOption();
  }

  /**
   * 目前選擇欄位小於最大可選擇數目，則自動增加選擇的顯示欄位
   * （用於裝置頁面大小變更時)
   */
  fillItem() {
    let selectedNumber = this.getSelectedList().length;
    const { _maxSelected } = this;
    if (selectedNumber < _maxSelected) {
      this._itemList = this._itemList.map(_list => {
        if (selectedNumber < _maxSelected && !_list.selected) {
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
    this._itemList = this._itemList.map(_list => {
      _list.canSelect = status;
      return _list;
    });

  }

  /**
   * 設定所有項目皆為可/不可取消的項目
   * @param status {boolean}-是否可點擊的狀態
   */
  setCanCancelStatus(status: boolean) {
    this._itemList = this._itemList.map(_list => {
      _list.canCancel = status;
      return _list;
    });

  }

  /**
   * 依分析類別將分析欄位設定儲存於localStorage中
   */
  saveOption() {
    const { _storageKey, _optionInfo: { object } } = this;
    const selectedList = this.getSelectedList();
    let storage = getLocalStorageObject(_storageKey);
    const { ver } = storage ?? '';
    const newOption = this.checkStorageVersion(ver) ? 
      { ...storage, [object]: selectedList } : { [object]: selectedList, ver: storageVersion };

    setLocalStorageObject(_storageKey, newOption);
    return;
  }

  /**
   * 取得已選擇的項目
   */
  getSelectedList() {
    return this._itemList.filter(_item => _item.selected)
      .map(_item => _item.info.item);
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
   * 取得特定階層選擇狀態
   * @param level {GroupLevel}-群組階層
   */
  getLayerSelectStatus(level: GroupLevel) {
    const index = this._layerList.findIndex(_layer => _layer.info.level === level);
    return this._layerList[index].selected;
  }

  /**
   * 取得特定欄位項目的選擇狀態
   */
  getItemSelectStatus(item: AnalysisSportsColumn) {
    const index = this._itemList.findIndex(_item => _item.info.item === item);
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

  /**
   * 取得群組類別
   */
  get optionInfo() {
    return this._optionInfo;
  }

}


/**
 * 處理單一選項選擇行為
 */
export class OneOption {

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