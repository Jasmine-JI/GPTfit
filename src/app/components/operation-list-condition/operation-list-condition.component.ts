import { Component, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {
  AllOperationCondition,
  OperationConditionResult,
  OperationCondition,
  ListItem,
} from '../../core/models/compo';
import { DescFirstSortDirection } from '../../core/enums/api';
import { SingleDropListComponent } from '../single-drop-list/single-drop-list.component';

@Component({
  selector: 'app-operation-list-condition',
  standalone: true,
  imports: [CommonModule, TranslateModule, SingleDropListComponent],
  templateUrl: './operation-list-condition.component.html',
  styleUrls: ['./operation-list-condition.component.scss'],
})
export class OperationListConditionComponent implements OnChanges {
  @Input() allConditionSetting: AllOperationCondition;
  @Output() changeCondition = new EventEmitter<OperationConditionResult>();

  /**
   * 列表展開與否
   */
  conditionSettingUnfold = false;

  /**
   * 條件設定結果
   */
  conditionResult: OperationConditionResult = {
    conditionList: [],
    sortType: 0,
    sortDirection: DescFirstSortDirection.desc,
  };

  /**
   * 收到條件設定時，同時回傳預設值
   * @param e {SimpleChanges}
   */
  ngOnChanges(e: SimpleChanges) {
    this.conditionResult = this.getDefaultResult(e.allConditionSetting.currentValue);
    this.submitCondition();
  }

  /**
   * 取得所有預設條件與排序
   * @param allConditionSetting {AllOperationCondition}-所有條件與排序設定清單
   */
  getDefaultResult(allConditionSetting: AllOperationCondition) {
    const {
      conditionList,
      sortTypeList: { list, initIndex },
    } = allConditionSetting;
    return {
      conditionList: this.getDefaultCondition(conditionList),
      sortType: list[initIndex].value as number,
      sortDirection: DescFirstSortDirection.desc,
    };
  }

  /**
   * 取得預設條件
   * @param conditionList {Array<OperationCondition>}-所有條件設定清單
   */
  getDefaultCondition(conditionList: Array<OperationCondition>) {
    return conditionList.map((_condition) => {
      const { type, initIndex, conditionItemList, conditionCode } = _condition;
      switch (type) {
        case 'dropList':
          return {
            conditionCode,
            selectedCode: conditionItemList
              ? (conditionItemList[initIndex ?? 0].value as number)
              : 0,
          };
        case 'keyword':
          return { conditionCode, keyword: '' };
        default:
          return { conditionCode };
      }
    });
  }

  /**
   * 送出條件
   */
  submitCondition() {
    this.changeCondition.emit(this.conditionResult);
  }

  /**
   * 處理列表設定收合
   */
  handleSettingUnfold() {
    this.conditionSettingUnfold = !this.conditionSettingUnfold;
  }

  /**
   * 單一條件類別選定項目
   * @param itemIndex {[number, number]}-選定的項目索引
   * @param conditionIndex {number}-條件類別索引
   */
  selectCondition(itemIndex: [number, number], conditionIndex: number) {
    const [, secondIndex] = itemIndex;
    const { conditionList } = this.allConditionSetting;
    const itemList = conditionList[conditionIndex].conditionItemList as ListItem[];
    const { value } = itemList[secondIndex];
    this.conditionResult.conditionList[conditionIndex].selectedCode = secondIndex;
    if (value !== undefined)
      this.conditionResult.conditionList[conditionIndex].value = value as number;
  }

  /**
   * 處理輸入框輸入文字
   * @param e {MouseEvent}
   * @param conditionIndex {number}-條件類別索引
   */
  handleInputText(e: MouseEvent, conditionIndex: number) {
    const { value } = (e as any).target;
    this.conditionResult.conditionList[conditionIndex].keyword = value ?? '';
  }

  /**
   * 選定排序類別
   * @param typeIndex {[number, number]}-選定的項目索引
   */
  selectSortType(typeIndex: [number, number]) {
    const [, secondIndex] = typeIndex;
    const { list } = this.allConditionSetting.sortTypeList;
    this.conditionResult.sortType = list[secondIndex].value as number;
  }

  /**
   * 選定排序方向
   * @param typeIndex {[number, number]}-選定的項目索引
   */
  selectSortDirect(directIndex: [number, number]) {
    const [, secondIndex] = directIndex;
    const { list } = this.allConditionSetting.sortTypeList;
    this.conditionResult.sortDirection = list[secondIndex].value as number;
  }
}
