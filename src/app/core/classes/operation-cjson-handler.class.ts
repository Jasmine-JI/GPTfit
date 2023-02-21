/**
 * 專門處理 api response cjson 格式
 */
export class OperationCjsonHandler {
  private _originData: any;
  private _fieldName: string;
  private _timeRange: any;
  private _nameCode: string; // 代號前綴

  constructor(fieldName: string, args: { data: any; timeRange?: any }) {
    const { data, timeRange } = args;
    this._fieldName = fieldName;
    this._originData = data;
    this._timeRange = timeRange;
  }

  getColumnChartData() {
    const { _originData, _nameCode, _fieldName } = this;
    Object.entries(_originData).forEach(([_key, _value]) => {});
  }

  getCompareChartData() {}

  getPieChartData() {}

  getNormalTableData() {}

  getTrendTableData() {}
}
