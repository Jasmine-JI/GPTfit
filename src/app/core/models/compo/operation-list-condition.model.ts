import { DescFirstSortDirection } from '../../enums/api';
import { ListItem } from './single-drop-list.model';

/**
 * 所有營運分析條件設定資訊
 */
export interface AllOperationCondition {
  conditionList: Array<OperationCondition>;
  sortTypeList: {
    list: Array<ListItem>;
    initIndex: number;
  };
  sortDirection: {
    list: Array<ListItem>;
    initIndex: number;
  };
}

/**
 * 單一營運分析列表條件設定資訊
 */
export interface OperationCondition {
  type: 'dropList' | 'keyword';
  titleTranslateKey: string;
  conditionCode: number;
  initIndex?: number;
  conditionItemList?: Array<ListItem>;
}

/**
 * 條件排序設定結束後的輸出結果
 */
export interface OperationConditionResult {
  conditionList: Array<{
    conditionCode: number;
    selectedCode?: number;
    keyword?: string;
    value?: number | string;
  }>;
  sortType: number;
  sortDirection: DescFirstSortDirection;
}
