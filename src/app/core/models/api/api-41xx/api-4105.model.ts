import { ProcessResult } from '../api-common/process-result.model';

export interface Api4105Post {
  token: string;
  groupId: string;
  startDate: number;
  endDate: number;
  dateUnit: number;
}

export interface Api4105Response {
  processResult: ProcessResult;
  trend: {
    timeRange: {
      fieldName: Array<string>;
      fieldValue: Array<Array<number>>;
    };
    groupCountsAnalysis: {
      fieldName: Array<string>;
      fieldValue: Array<Array<number>>;
    };
    childGroupAnalysisList: {
      innerFieldName: Array<string>;
      childGroupList: Array<{
        groupId: string;
        groupName: string;
        fieldValue: Array<Array<number>>;
      }>;
    };
    deviceCounts: {
      fieldName: Array<string>;
      useCountsFieldValue: Array<Array<number>>;
    };
  };
}
