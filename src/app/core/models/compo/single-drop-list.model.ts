/**
 * 下拉選單單一選項內容
 */
export interface ListItem {
  textKey: string;
  id?: number;
  value?: string | number | Array<number> | null;
}

/**
 * 下拉選單內依選項類型分類
 */
export interface SingleLayerList {
  titleKey?: string;
  id?: number;
  list: Array<ListItem>;
}
