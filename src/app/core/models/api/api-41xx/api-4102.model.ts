import { ProcessResult } from '../api-common/process-result.model';
import { SystemAnalysisType } from '../../../enums/api';

export interface Api4102Post {
  token: string;
  type: SystemAnalysisType; // 1.群組 2.會員 3.裝置
  startDate: number;
  endDate: number;
  dateUnit: number; // 1. 週 2. 月
}

export interface Api4102Response {
  processResult: ProcessResult;
  trend: {
    timeRange: {
      fieldName: Array<number>;
      fieldValue: Array<Array<string>>;
    };
    groupCountsAnalysis?: {
      fieldName: Array<string>;
      fieldValue: Array<Array<number>>;
    };
    memberAnalysis?: {
      fieldName: Array<string>;
      fieldValue: Array<Array<number>>;
    };
    sportsTypeAnalysis?: {
      fieldName: Array<string>;
      maleFieldValue: Array<Array<number>>;
      femaleFieldValue: Array<Array<number>>;
    };
    deviceTypeAnalysis?: {
      fieldName: Array<string>;
      enableFieldValue: Array<Array<number>>;
      registerFieldValue: Array<Array<number>>;
    };
  };
}
