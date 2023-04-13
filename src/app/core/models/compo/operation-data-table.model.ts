import { OperationDataType } from '../../enums/compo';

export interface OperationTableOption {
  showTotal?: boolean; // 是否顯示總計值
  secondColumnHeader?: boolean; // 是否有第二行標頭
  headerRowType: Array<OperationDataType>; // 第一列標頭類型
  secondHeaderRowType?: Array<OperationDataType>; // 第二列標頭類型
  valueRowType: Array<OperationDataType>; // 其他列的表格類型
  valueRowStyle?: Array<TableStyleOption>; // 每個數據列的背景色
  detailButton?: boolean; // 此表格是否含每列標題是否有彈跳視窗按鈕
}

export interface TableStyleOption {
  bgColor: string;
  fontWeight: string;
  fontColor: string;
}
