import { OperationDataType } from '../../enums/compo';

export interface OperationTableOption {
  compareMode?: boolean; // 列表是否為比較模式
  compareDirection?: 'column' | 'row'; // 列表比較方向
  showTotal?: boolean; // 是否顯示總計值
  secondColumnHeader?: boolean; // 是否有第二行標頭
  headerRowType: Array<OperationDataType>; // 第一列標頭類型
  secondHeaderRowType?: Array<OperationDataType>; // 第二列標頭類型
  valueRowType: Array<OperationDataType>; // 其他列的表格類型
  valueRowStyle?: Array<TableStyleOption>;
}

export interface TableStyleOption {
  bgColor: string;
  fontWeight: string;
  fontColor: string;
}